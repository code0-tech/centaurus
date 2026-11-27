import { Action, CodeZeroEvent, PlainValue } from "@code0-tech/hercules";
import type { ActionFlow } from "@code0-tech/tucana/aquila";
import { toAllowedValue } from "@code0-tech/tucana/helpers";
import { SocketModeClient } from "@slack/socket-mode";
import { fromSlackTs, fromUnixSeconds, normalizeMessageTs, withoutUndefined } from "./helpers.js";

export { normalizeMessageTs };

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

/** The triggers of this action; only their flows need a Socket Mode connection. */
export const EVENT_IDENTIFIERS = new Set([
    "SlackMessagePosted",
    "SlackAppMentioned",
    "SlackReactionAdded",
    "SlackChannelCreated",
    "SlackSlashCommand",
]);

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

/**
 * Converts the points in time of a delivery into `DATE` values. Message IDs
 * (`ts`, `thread_ts`, `item.ts`) stay text, so they can be passed straight into
 * the message ID parameters of the functions.
 */
export function toFlowPayload(type: string, body: SlackSocketDelivery["body"]): PlainValue {
    if (type !== "events_api" || !body?.event) {
        return withoutUndefined(body ?? null);
    }

    const event = body.event;
    return withoutUndefined({
        ...body,
        event_time: fromUnixSeconds(body.event_time),
        event: {
            ...event,
            event_ts: fromSlackTs(event.event_ts),
            channel:
                event.channel && typeof event.channel === "object"
                    ? { ...event.channel, created: fromUnixSeconds(event.channel.created) }
                    : event.channel,
        },
    });
}

/** A flow's setting as a plain value, or `undefined` if it is not set. */
function setting(flow: ActionFlow, identifier: string): PlainValue | undefined {
    const encoded = flow.settings.find((candidate) => candidate.flowSettingId === identifier)?.value;
    return encoded ? toAllowedValue(encoded) : undefined;
}

/** A flow's text setting, or `undefined` if it is not set. */
function textSetting(flow: ActionFlow, identifier: string): string | undefined {
    const value = setting(flow, identifier);
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** The `appToken` setting of a flow, or `undefined` if it has none. */
export function appTokenOf(flow: ActionFlow): string | undefined {
    return textSetting(flow, "appToken");
}

/** The optional `channelId` setting of a flow, or `undefined` for "every channel". */
export function channelFilter(flow: ActionFlow): string | undefined {
    return textSetting(flow, "channelId");
}

/** The optional `messageId` setting of a flow, normalized, or `undefined` for "every message". */
export function messageFilter(flow: ActionFlow): string | undefined {
    const value = textSetting(flow, "messageId");
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
 * Every trigger flow names the Slack app it listens with in its `appToken`
 * setting, so one WebSocket connection is kept per app token in use. The
 * connections follow the flows Aquila sends: they are opened and closed
 * whenever a flow changes. Because the action dials out to Slack, no public
 * URL, URL verification challenge or request signature check is needed.
 */
export class SlackSocketManager {
    private readonly connections = new Map<string, SlackSocketClient>();
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
        this.action.on(CodeZeroEvent.connected, this.sync);
        this.action.on(CodeZeroEvent.flowUpdated, this.sync);
        this.action.on(CodeZeroEvent.flowDeleted, this.sync);
        this.sync();
    }

    async stop(): Promise<void> {
        this.started = false;
        this.action.off(CodeZeroEvent.connected, this.sync);
        this.action.off(CodeZeroEvent.flowUpdated, this.sync);
        this.action.off(CodeZeroEvent.flowDeleted, this.sync);
        const clients = [...this.connections.values()];
        this.connections.clear();
        await Promise.all(clients.map((client) => client.disconnect().catch(() => undefined)));
    }

    /** Opens and closes connections to match the app tokens the trigger flows use. */
    readonly sync = (): void => {
        const wanted = new Set<string>();
        for (const flow of this.action.flows.values()) {
            if (!EVENT_IDENTIFIERS.has(flow.type)) {
                continue;
            }
            const appToken = appTokenOf(flow);
            if (appToken) {
                wanted.add(appToken);
            } else {
                this.reportError(`flow ${flow.flowId} has no Slack app token; it will not trigger.`);
            }
        }

        for (const [appToken, client] of this.connections) {
            if (!wanted.has(appToken)) {
                this.connections.delete(appToken);
                void client.disconnect().catch(() => undefined);
            }
        }

        for (const appToken of wanted) {
            if (this.connections.has(appToken)) {
                continue;
            }
            const client = this.createClient(appToken);
            client.on("slack_event", (delivery) => void this.handle(appToken, delivery));
            this.connections.set(appToken, client);
            client.start().catch((error) => {
                this.reportError("could not connect; check the Slack app token of the trigger.", error);
                // Forget the failed connection so the next flow update retries.
                if (this.connections.get(appToken) === client) {
                    this.connections.delete(appToken);
                }
            });
        }
    };

    /** Acknowledges a delivery and fires every flow listening with this app token that it matches. */
    async handle(appToken: string, { ack, type, body }: SlackSocketDelivery): Promise<void> {
        // Acknowledge right away: Slack redelivers anything not acknowledged within
        // three seconds, while a flow may run much longer.
        if (ACKNOWLEDGED_TYPES.has(type)) {
            await ack().catch((error) => this.reportError("could not acknowledge a delivery.", error));
        }

        const route = routeDelivery(type, body);
        if (!route) {
            return;
        }

        let payload: PlainValue | undefined;
        for (const flow of this.action.flows.values()) {
            if (flow.type !== route.flowType || appTokenOf(flow) !== appToken) {
                continue;
            }
            if (!matchesFilters(flow, route)) {
                continue;
            }
            payload ??= toFlowPayload(type, body);
            this.action
                .fire(flow.flowId, payload)
                .catch((error) => this.reportError(`flow ${flow.flowId} failed.`, error));
        }
    }
}
