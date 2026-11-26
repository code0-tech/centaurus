import { createServer, IncomingMessage, Server, ServerResponse } from "node:http";
import { Action, CodeZeroEvent, PlainValue } from "@code0-tech/hercules";
import { callTelegram } from "./api.js";
import { mapTelegramCallbackQuery, mapTelegramMessage, toEventPayload } from "./helpers.js";
import {
    ActionFlow,
    ALLOWED_UPDATES,
    BotWebhook,
    matchingFlows,
    planWebhooks,
    resolveWebhookRequest,
    SECRET_HEADER,
} from "./webhook.js";

/**
 * Bridges Telegram updates to the flows that listen for them.
 *
 * Every event flow names its bot token (and optionally a webhook secret) in its
 * settings. Whenever the flows change, the bridge registers a webhook with
 * Telegram for each bot in use - pointing at this action's HTTP server - and
 * removes the webhooks of bots no flow uses anymore. An incoming update is
 * checked against the bot's secret and then fires the bot's flows whose
 * filters match.
 */
export interface WebhookConfig {
    /** The public base URL Telegram reaches the webhook server under, e.g. https://bots.example.com. */
    publicUrl?: string;
    host: string;
    port: number;
}

export function webhookConfigFromEnv(env: NodeJS.ProcessEnv = process.env): WebhookConfig {
    const port = Number(env.TELEGRAM_WEBHOOK_PORT ?? 8080);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        throw new Error(`Invalid TELEGRAM_WEBHOOK_PORT: ${env.TELEGRAM_WEBHOOK_PORT}`);
    }

    return {
        publicUrl: env.TELEGRAM_WEBHOOK_URL?.trim().replace(/\/+$/, "") || undefined,
        host: env.TELEGRAM_WEBHOOK_HOST ?? "0.0.0.0",
        port,
    };
}

/** Aquila reports flows one message at a time, so a burst is coalesced. */
const SYNC_DEBOUNCE_MS = 250;
/** A webhook Telegram refused is tried again after this long. */
const RETRY_MS = 60 * 1000;
/** Updates are small; anything bigger is not from Telegram. */
const MAX_BODY_BYTES = 1024 * 1024;

export class EventBridge {
    private webhooks = new Map<string, BotWebhook>();
    /** What was registered with Telegram per bot token: the webhook URL and secret. */
    private registered = new Map<string, string>();
    private syncTimer: NodeJS.Timeout | undefined;
    private syncing: Promise<void> = Promise.resolve();
    private warnedNoUrl = false;

    constructor(
        private readonly action: Action,
        private readonly config: WebhookConfig
    ) {}

    start(): Server {
        this.action.on(CodeZeroEvent.connected, () => this.scheduleSync());
        this.action.on(CodeZeroEvent.flowUpdated, (flow: ActionFlow) => {
            console.log(`Flow ${flow.flowId} (${flow.type}) was updated.`);
            this.scheduleSync();
        });
        this.action.on(CodeZeroEvent.flowDeleted, (flowId: bigint) => {
            console.log(`Flow ${flowId} was deleted.`);
            this.scheduleSync();
        });

        const server = createServer((request, response) => void this.handle(request, response));
        server.listen(this.config.port, this.config.host, () => {
            console.log(`Listening for Telegram updates on ${this.config.host}:${this.config.port}`);
        });
        return server;
    }

    scheduleSync(delay = SYNC_DEBOUNCE_MS): void {
        if (this.syncTimer) clearTimeout(this.syncTimer);
        this.syncTimer = setTimeout(() => {
            this.syncTimer = undefined;
            // Syncs run one after another, so two never race on setWebhook.
            this.syncing = this.syncing.then(() => this.sync());
        }, delay);
        this.syncTimer.unref?.();
    }

    async sync(): Promise<void> {
        this.webhooks = planWebhooks(this.action.flows.values());

        if (!this.config.publicUrl) {
            if (this.webhooks.size > 0 && !this.warnedNoUrl) {
                this.warnedNoUrl = true;
                console.warn(
                    "Telegram event flows exist, but TELEGRAM_WEBHOOK_URL is not set - Telegram cannot deliver updates to this action."
                );
            }
            return;
        }

        let failed = false;
        const inUse = new Set<string>();

        for (const webhook of this.webhooks.values()) {
            inUse.add(webhook.token);

            const url = `${this.config.publicUrl}${webhook.path}`;
            const fingerprint = `${url}\n${webhook.secret}`;
            if (this.registered.get(webhook.token) === fingerprint) continue;

            try {
                await callTelegram(webhook.token, "setWebhook", {
                    url,
                    secret_token: webhook.secret,
                    allowed_updates: ALLOWED_UPDATES,
                });
                this.registered.set(webhook.token, fingerprint);
                console.log(
                    `Registered the Telegram webhook of bot ${botId(webhook.token)} for ${webhook.flows.length} flow(s).`
                );
            } catch (error: any) {
                failed = true;
                this.registered.delete(webhook.token);
                console.error(
                    `Could not register the Telegram webhook of bot ${botId(webhook.token)}: ${errorText(error)}`
                );
            }
        }

        // Only webhooks this process registered are removed - a bot whose
        // webhook was set up elsewhere is never touched.
        for (const token of [...this.registered.keys()]) {
            if (inUse.has(token)) continue;
            try {
                await callTelegram(token, "deleteWebhook");
                this.registered.delete(token);
                console.log(`Removed the Telegram webhook of bot ${botId(token)} - no event flow uses it anymore.`);
            } catch (error: any) {
                failed = true;
                console.error(`Could not remove the Telegram webhook of bot ${botId(token)}: ${errorText(error)}`);
            }
        }

        if (failed) this.scheduleSync(RETRY_MS);
    }

    private async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
        let body: string;
        try {
            body = request.method === "POST" ? await readBody(request) : "";
        } catch {
            return respond(response, 413, "Payload too large");
        }

        const result = resolveWebhookRequest(
            { method: request.method, url: request.url, secret: request.headers[SECRET_HEADER], body },
            this.webhooks
        );
        if (result.status !== 200) return respond(response, result.status, result.message);

        // Telegram waits for the answer before it sends the next update of the
        // bot and retries on errors, so the update is acknowledged right away
        // instead of after the flows ran.
        respond(response, 200, "OK");
        await this.dispatch(result.webhook, result.update);
    }

    async dispatch(webhook: BotWebhook, update: Parameters<typeof matchingFlows>[1]): Promise<void> {
        const match = matchingFlows(webhook, update);
        if (!match || match.flows.length === 0) return;

        const payload =
            match.identifier === "TelegramMessageReceived"
                ? toEventPayload(mapTelegramMessage(update.message!))
                : toEventPayload(mapTelegramCallbackQuery(update.callback_query!));

        await fireFlows(this.action, match.flows, payload);
    }
}

/** The numeric bot id in front of the token's colon - public, unlike the token. */
function botId(token: string): string {
    return token.split(":")[0];
}

function errorText(error: any): string {
    return error?.description ?? error?.message ?? String(error);
}

function readBody(request: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let size = 0;

        request.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > MAX_BODY_BYTES) {
                request.destroy();
                reject(new Error("Payload too large"));
                return;
            }
            chunks.push(chunk);
        });
        request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        request.on("error", reject);
    });
}

function respond(response: ServerResponse, status: number, message: string): void {
    if (response.headersSent) return;
    response.writeHead(status, { "Content-Type": "text/plain" });
    response.end(message);
}

async function fireFlows(action: Action, flows: ActionFlow[], payload: PlainValue): Promise<void> {
    const results = await Promise.allSettled(flows.map((flow) => action.fire(flow.flowId, payload)));

    results.forEach((result, index) => {
        if (result.status === "fulfilled") return;
        const reason: any = result.reason;
        console.error(`Flow ${flows[index].flowId} failed: ${reason?.message ?? String(reason)}`);
    });
}
