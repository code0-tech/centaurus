import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { Action } from "@code0-tech/hercules";
import { ApiUpdate } from "./helpers.js";

/**
 * The pure part of the webhook: which bots need a webhook, under which path and
 * with which secret, and whether an incoming request is a genuine update of
 * one of them. The IO around it (HTTP server, setWebhook) lives in
 * eventBridge.ts.
 */
export type ActionFlow = ReturnType<Action["flows"]["values"]>[number];

export const EVENT_IDENTIFIERS = new Set(["TelegramMessageReceived", "TelegramCallbackQuery"]);

/** The header Telegram puts the `secret_token` of setWebhook into. */
export const SECRET_HEADER = "x-telegram-bot-api-secret-token";

/** The update kinds the events react to - Telegram sends nothing else. */
export const ALLOWED_UPDATES = ["message", "callback_query"];

const SECRET_PATTERN = /^[A-Za-z0-9_-]{1,256}$/;
const PATH_PATTERN = /\/telegram\/([0-9a-f]{32})\/?$/;

export interface BotWebhook {
    token: string;
    /** The path the webhook URL ends in; it identifies the bot without revealing its token. */
    path: string;
    secret: string;
    flows: ActionFlow[];
}

/** One webhook per bot: the path is derived from the token, so it is stable across restarts. */
export function webhookPath(token: string): string {
    return `/telegram/${createHash("sha256").update(token).digest("hex").slice(0, 32)}`;
}

/**
 * The secret used when no flow of a bot sets one. Derived instead of random so
 * that every instance of the action - and every restart - registers the same
 * one, and only someone who knows the bot token can compute it.
 */
export function deriveSecret(token: string): string {
    return createHmac("sha256", token).update("centaurus-telegram-webhook").digest("base64url");
}

/**
 * Group the event flows by bot. Telegram keeps a single webhook - and so a
 * single secret - per bot: the first secret a flow sets (by flow id) is the
 * bot's secret, and a flow insisting on a different one is skipped, since no
 * update could ever carry its secret.
 */
export function planWebhooks(flows: ActionFlow[], warn: (message: string) => void = console.warn): Map<string, BotWebhook> {
    const byToken = new Map<string, ActionFlow[]>();

    const byFlowId = (a: ActionFlow, b: ActionFlow) => {
        const [left, right] = [BigInt(a.flowId), BigInt(b.flowId)];
        return left < right ? -1 : left > right ? 1 : 0;
    };

    for (const flow of [...flows].sort(byFlowId)) {
        if (!EVENT_IDENTIFIERS.has(flow.type)) continue;

        const token = readSetting(flow, "botToken");
        if (!token) {
            const received = flow.settings
                .map((setting) => `${setting.flowSettingId}=${setting.value?.kind.oneofKind ?? "empty"}`)
                .join(", ");
            warn(
                `Flow ${flow.flowId} listens for ${flow.type} without a bot token - skipping it (settings: ${received || "none"}).`
            );
            continue;
        }

        const secret = readSetting(flow, "webhookSecret");
        if (secret && !SECRET_PATTERN.test(secret)) {
            warn(
                `Flow ${flow.flowId} has a webhook secret Telegram does not accept (1-256 characters of A-Z, a-z, 0-9, _ and -) - skipping it.`
            );
            continue;
        }

        byToken.set(token, [...(byToken.get(token) ?? []), flow]);
    }

    const webhooks = new Map<string, BotWebhook>();
    for (const [token, tokenFlows] of byToken) {
        const explicit = tokenFlows.map((flow) => readSetting(flow, "webhookSecret")).find(Boolean);
        const secret = explicit ?? deriveSecret(token);

        const accepted = tokenFlows.filter((flow) => {
            const own = readSetting(flow, "webhookSecret");
            if (!own || own === secret) return true;

            warn(
                `Flow ${flow.flowId} sets a different webhook secret than another flow of the same bot - a bot has one webhook, so it is skipped.`
            );
            return false;
        });

        const path = webhookPath(token);
        webhooks.set(path, { token, path, secret, flows: accepted });
    }

    return webhooks;
}

export interface WebhookRequest {
    method?: string;
    url?: string;
    secret?: string | string[];
    body: string;
}

export type WebhookResult =
    | { status: 200; webhook: BotWebhook; update: ApiUpdate }
    | { status: 400 | 401 | 404 | 405; message: string };

/**
 * Decide what to do with a request to the webhook server. Only a POST to a
 * known bot's path that carries the bot's secret is an update; everything else
 * is rejected before its body is even parsed.
 */
export function resolveWebhookRequest(request: WebhookRequest, webhooks: Map<string, BotWebhook>): WebhookResult {
    if (request.method !== "POST") return { status: 405, message: "Method not allowed" };

    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    const match = PATH_PATTERN.exec(pathname);
    const webhook = match ? webhooks.get(`/telegram/${match[1]}`) : undefined;
    if (!webhook) return { status: 404, message: "Not found" };

    const secret = Array.isArray(request.secret) ? request.secret[0] : request.secret;
    if (!secret || !secretsEqual(secret, webhook.secret)) return { status: 401, message: "Invalid secret token" };

    let update: ApiUpdate;
    try {
        update = JSON.parse(request.body) as ApiUpdate;
    } catch {
        return { status: 400, message: "Invalid JSON" };
    }
    if (!update || typeof update.update_id !== "number") return { status: 400, message: "Not a Telegram update" };

    return { status: 200, webhook, update };
}

function secretsEqual(given: string, expected: string): boolean {
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}

/** The flows of a bot an update starts, after the filters each flow set. */
export function matchingFlows(webhook: BotWebhook, update: ApiUpdate): { identifier: string; flows: ActionFlow[] } | undefined {
    if (update.message) {
        const chatId = String(update.message.chat.id);
        return {
            identifier: "TelegramMessageReceived",
            flows: webhook.flows.filter(
                (flow) => flow.type === "TelegramMessageReceived" && settingMatches(flow, "chatId", chatId)
            ),
        };
    }

    if (update.callback_query) {
        const query = update.callback_query;
        const chatId = query.message ? String(query.message.chat.id) : "";
        return {
            identifier: "TelegramCallbackQuery",
            flows: webhook.flows.filter(
                (flow) =>
                    flow.type === "TelegramCallbackQuery" &&
                    settingMatches(flow, "chatId", chatId) &&
                    settingMatches(flow, "data", query.data ?? "")
            ),
        };
    }

    return undefined;
}

/** A setting the flow left empty is a wildcard, not a filter for `""`. */
function settingMatches(flow: ActionFlow, identifier: string, value: string): boolean {
    const setting = readSetting(flow, identifier);
    return !setting || setting === value;
}

export function readSetting(flow: ActionFlow, identifier: string): string | undefined {
    const setting = flow.settings.find((candidate) => candidate.flowSettingId === identifier);
    if (setting?.value?.kind.oneofKind !== "stringValue") return undefined;

    const value = setting.value.kind.stringValue.trim();
    return value.length > 0 ? value : undefined;
}
