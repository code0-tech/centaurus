import { Action, CodeZeroEvent } from "@code0-tech/hercules";
import type { ActionFlow } from "@code0-tech/tucana/aquila";
import { toAllowedValue } from "@code0-tech/tucana/helpers";
import { SocketModeClient } from "@slack/socket-mode";

/** A single delivery as emitted by `SocketModeClient` on `slack_event`. */
export interface SlackSocketDelivery {
    ack: (response?: Record<string, unknown>) => Promise<void>;
    type: string;
    // Slack payloads are open-ended JSON; routeDelivery only reads a few fields.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any;
}

/** The part of `SocketModeClient` the manager uses, so tests can fake it. */
export interface SlackSocketClient {
    on(event: "slack_event", listener: (delivery: SlackSocketDelivery) => void): unknown;
    start(): Promise<unknown>;
    disconnect(): Promise<void>;
}

/** Delivery types Slack expects an acknowledgement for within three seconds. */
const ACKNOWLEDGED_TYPES = new Set(["events_api", "slash_commands", "interactive"]);

/** Where a delivery happened; matched against the optional filter settings of a flow. */
export interface SlackDeliveryRoute {
    flowType: string;
    channel?: string;
    /** The timestamp of the message a reaction was added to. */
    messageTs?: string;
}

/**
 * Maps a Socket Mode delivery to the flow type it triggers and where it
 * happened, or `undefined` if no Slack event of this action handles it.
 */
export function routeDelivery(type: string, body: SlackSocketDelivery["body"]): SlackDeliveryRoute | undefined {
    if (type === "slash_commands") {
        return { flowType: "SlackSlashCommand", channel: body?.channel_id };
    }
    if (type !== "events_api") {
        return undefined;
    }

    const event = body?.event;
    switch (event?.type) {
        case "message":
            // Skip edits, deletions and join notices (they carry a subtype) and bot
            // messages; the latter also stops a flow that posts into the channel
            // from triggering itself over and over.
            if (event.subtype || event.bot_id) {
                return undefined;
            }
            return { flowType: "SlackMessagePosted", channel: event.channel };
        case "app_mention":
            return { flowType: "SlackAppMentioned", channel: event.channel };
        case "reaction_added":
            return { flowType: "SlackReactionAdded", channel: event.item?.channel, messageTs: event.item?.ts };
        case "channel_created":
            return { flowType: "SlackChannelCreated", channel: event.channel?.id };
        default:
            return undefined;
    }
}

/** A flow's text setting, or `undefined` if it is not set. */
function textSetting(flow: ActionFlow, identifier: string): string | undefined {
    const encoded = flow.settings.find((setting) => setting.flowSettingId === identifier)?.value;
    const value = encoded ? toAllowedValue(encoded) : undefined;
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** The optional `channelId` setting of a flow, or `undefined` for "every channel". */
export function channelFilter(flow: ActionFlow): string | undefined {
    return textSetting(flow, "channelId");
}

/**
 * Turns a message timestamp or a Slack message link
 * (`…/archives/C0123ABC/p1712345678123456`) into Slack's `1712345678.123456`
 * form, so the copied link works as well as the timestamp itself.
 */
export function normalizeMessageTs(value: string): string {
    const linked = /\/p(\d{7,})(?:[/?#]|$)/.exec(value);
    const digits = linked ? linked[1] : value.trim().replace(/^p/, "");
    return /^\d{7,}$/.test(digits) ? `${digits.slice(0, -6)}.${digits.slice(-6)}` : value.trim();
}

/** The optional `messageTs` setting of a flow, normalized, or `undefined` for "every message". */
export function messageFilter(flow: ActionFlow): string | undefined {
    const value = textSetting(flow, "messageTs");
    return value === undefined ? undefined : normalizeMessageTs(value);
}

/** Whether a flow's filter settings let a delivery through. */
export function matchesFilters(flow: ActionFlow, route: SlackDeliveryRoute): boolean {
    const channel = channelFilter(flow);
    if (channel && channel !== route.channel) {
        return false;
    }
    const messageTs = messageFilter(flow);
    return !messageTs || messageTs === route.messageTs;
}

/**
 * Receives Slack events over Socket Mode and fires the matching flows.
 *
 * Every project brings its own Slack app, so one WebSocket connection is kept
 * per project with an `app_token` configured. Connections follow the project
 * configuration Aquila sends: they are opened, replaced or closed whenever it
 * changes. Because the action dials out to Slack, no public URL, URL
 * verification challenge or request signature check is needed.
 */
export class SlackSocketManager {
    private readonly connections = new Map<bigint, { appToken: string; client: SlackSocketClient }>();
    private started = false;

    constructor(
        private readonly action: Action,
        private readonly createClient: (appToken: string) => SlackSocketClient = (appToken) =>
            new SocketModeClient({ appToken }),
        private readonly reportError: (message: string, error?: unknown) => void = (message, error) =>
            console.error(`Slack Socket Mode: ${message}`, error instanceof Error ? error.message : (error ?? ""))
    ) {}

    start(): void {
        if (this.started) {
            return;
        }
        this.started = true;
        this.action.on(CodeZeroEvent.moduleUpdated, this.sync);
        this.sync();
    }

    async stop(): Promise<void> {
        this.started = false;
        this.action.off(CodeZeroEvent.moduleUpdated, this.sync);
        const connections = [...this.connections.values()];
        this.connections.clear();
        await Promise.all(connections.map(({ client }) => client.disconnect().catch(() => undefined)));
    }

    /** Opens, replaces or closes connections to match the current project configuration. */
    readonly sync = (): void => {
        const wanted = new Map<bigint, string>();
        for (const config of this.action.configs.values()) {
            const appToken = config.findConfig("app_token");
            if (typeof appToken === "string" && appToken.trim()) {
                wanted.set(BigInt(config.projectId), appToken.trim());
            }
        }

        for (const [projectId, connection] of this.connections) {
            if (wanted.get(projectId) !== connection.appToken) {
                this.connections.delete(projectId);
                void connection.client.disconnect().catch(() => undefined);
            }
        }

        for (const [projectId, appToken] of wanted) {
            if (this.connections.has(projectId)) {
                continue;
            }
            const client = this.createClient(appToken);
            const connection = { appToken, client };
            client.on("slack_event", (delivery) => void this.handle(projectId, delivery));
            this.connections.set(projectId, connection);
            client.start().catch((error) => {
                this.reportError(`could not connect for project ${projectId}; check the app_token config.`, error);
                // Forget the failed connection so the next configuration update retries.
                if (this.connections.get(projectId) === connection) {
                    this.connections.delete(projectId);
                }
            });
        }
    };

    /** Acknowledges a delivery and fires every flow of the project it matches. */
    async handle(projectId: bigint, { ack, type, body }: SlackSocketDelivery): Promise<void> {
        // Acknowledge right away: Slack redelivers anything not acknowledged within
        // three seconds, while a flow may run much longer.
        if (ACKNOWLEDGED_TYPES.has(type)) {
            await ack().catch((error) => this.reportError("could not acknowledge a delivery.", error));
        }

        const route = routeDelivery(type, body);
        if (!route) {
            return;
        }

        for (const flow of this.action.flows.values()) {
            if (flow.projectId !== projectId || flow.type !== route.flowType) {
                continue;
            }
            if (!matchesFilters(flow, route)) {
                continue;
            }
            this.action
                .fire(flow.flowId, body)
                .catch((error) => this.reportError(`flow ${flow.flowId} failed.`, error));
        }
    }
}
