import "reflect-metadata";
import { EventEmitter } from "node:events";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";
import type { ActionFlow } from "@code0-tech/tucana/aquila";
import { constructValue } from "@code0-tech/tucana/helpers";
import { describe, expect, it, vi } from "vitest";
import {
    normalizeMessageTs,
    routeDelivery,
    SlackSocketClient,
    SlackSocketDelivery,
    SlackSocketManager,
    toFlowPayload,
} from "../src/socketMode.js";

const flow = (
    flowId: number,
    appToken: string | undefined,
    type: string,
    channelId?: string,
    messageTs?: string
): ActionFlow =>
    ({
        flowId: BigInt(flowId),
        projectId: 1n,
        type,
        settings: [
            ...(appToken === undefined
                ? []
                : [{ flowSettingId: "appToken", value: constructValue(appToken) }]),
            ...(channelId === undefined ? [] : [{ flowSettingId: "channelId", value: constructValue(channelId) }]),
            ...(messageTs === undefined ? [] : [{ flowSettingId: "messageTs", value: constructValue(messageTs) }]),
        ],
    }) as unknown as ActionFlow;

/** Just enough of an Action: flows, events and fire. */
function fakeAction(flows: ActionFlow[] = []) {
    const emitter = new EventEmitter();
    const action = {
        flows: new Map(flows.map((entry) => [entry.flowId, entry])),
        on: emitter.on.bind(emitter),
        off: emitter.off.bind(emitter),
        emit: emitter.emit.bind(emitter),
        fire: vi.fn(async (_flowId: bigint, _payload?: unknown) => null),
    };
    return action as typeof action & Action;
}

/** A fake SocketModeClient that records its token and lets tests push deliveries. */
function fakeClients() {
    const created: { appToken: string; client: SlackSocketClient; deliver: (delivery: SlackSocketDelivery) => void }[] = [];
    const createClient = (appToken: string) => {
        let listener: ((delivery: SlackSocketDelivery) => void) | undefined;
        const client: SlackSocketClient = {
            on: (_event, handler) => {
                listener = handler;
            },
            start: vi.fn(async () => undefined),
            disconnect: vi.fn(async () => undefined),
        };
        created.push({ appToken, client, deliver: (delivery) => listener?.(delivery) });
        return client;
    };
    return { created, createClient };
}

const eventsApi = (event: Record<string, unknown>) => ({
    ack: vi.fn(async () => undefined),
    type: "events_api",
    body: { type: "event_callback", team_id: "T1", event },
});

describe("routeDelivery", () => {
    it("maps each Slack event to its trigger and channel", () => {
        expect(routeDelivery("events_api", { event: { type: "message", channel: "C1", text: "hi" } })).toEqual({
            flowType: "SlackMessagePosted",
            channel: "C1",
        });
        expect(routeDelivery("events_api", { event: { type: "app_mention", channel: "C2" } })).toEqual({
            flowType: "SlackAppMentioned",
            channel: "C2",
        });
        expect(
            routeDelivery("events_api", { event: { type: "reaction_added", item: { channel: "C3", ts: "1712345678.123456" } } })
        ).toEqual({
            flowType: "SlackReactionAdded",
            channel: "C3",
            messageTs: "1712345678.123456",
        });
        expect(routeDelivery("events_api", { event: { type: "channel_created", channel: { id: "C4" } } })).toEqual({
            flowType: "SlackChannelCreated",
            channel: "C4",
        });
        expect(routeDelivery("slash_commands", { command: "/deploy", channel_id: "C5" })).toEqual({
            flowType: "SlackSlashCommand",
            channel: "C5",
        });
    });

    it("skips bot messages, message subtypes and unknown deliveries", () => {
        expect(routeDelivery("events_api", { event: { type: "message", channel: "C1", bot_id: "B1" } })).toBeUndefined();
        expect(routeDelivery("events_api", { event: { type: "message", channel: "C1", subtype: "message_changed" } })).toBeUndefined();
        expect(routeDelivery("events_api", { event: { type: "team_join" } })).toBeUndefined();
        expect(routeDelivery("interactive", { type: "block_actions" })).toBeUndefined();
    });
});

describe("normalizeMessageTs", () => {
    it("accepts a timestamp, the p… part of a link or a whole message link", () => {
        expect(normalizeMessageTs("1712345678.123456")).toBe("1712345678.123456");
        expect(normalizeMessageTs(" 1712345678123456 ")).toBe("1712345678.123456");
        expect(normalizeMessageTs("p1712345678123456")).toBe("1712345678.123456");
        expect(normalizeMessageTs("https://team.slack.com/archives/C0123ABC/p1712345678123456")).toBe("1712345678.123456");
        expect(
            normalizeMessageTs("https://team.slack.com/archives/C0123ABC/p1712345678123456?thread_ts=1712345600.000100&cid=C0123ABC")
        ).toBe("1712345678.123456");
    });
});

describe("toFlowPayload", () => {
    it("turns the points in time of an Events API delivery into DATE values", () => {
        expect(
            toFlowPayload("events_api", {
                type: "event_callback",
                event_time: 1712345678,
                event: { type: "message", channel: "C1", ts: "1712345678.123456", event_ts: "1712345678.123456" },
            })
        ).toEqual({
            type: "event_callback",
            event_time: 1712345678000000,
            event: { type: "message", channel: "C1", ts: 1712345678123456, event_ts: 1712345678123456 },
        });
    });

    it("converts the reacted message and a created channel", () => {
        const reaction = toFlowPayload("events_api", {
            event: { type: "reaction_added", item: { type: "message", channel: "C1", ts: "1712345678.000001" } },
        }) as { event: { item: { ts: number } } };
        const created = toFlowPayload("events_api", {
            event: { type: "channel_created", channel: { id: "C1", created: 1712345678 } },
        }) as { event: { channel: { created: number } } };

        expect(reaction.event.item.ts).toBe(1712345678000001);
        expect(created.event.channel.created).toBe(1712345678000000);
    });

    it("passes a slash command through unchanged", () => {
        expect(toFlowPayload("slash_commands", { command: "/deploy" })).toEqual({ command: "/deploy" });
    });
});

describe("SlackSocketManager", () => {
    it("opens one connection per app token the trigger flows use", () => {
        const action = fakeAction([
            flow(1, "xapp-one", "SlackMessagePosted"),
            flow(2, "xapp-one", "SlackReactionAdded"),
            flow(3, "xapp-three", "SlackSlashCommand"),
            flow(4, undefined, "SlackMessagePosted"),
            flow(5, "xapp-ignored", "SomeOtherFlow"),
        ]);
        const { created, createClient } = fakeClients();

        new SlackSocketManager(action, createClient, () => undefined).start();

        expect(created.map((entry) => entry.appToken)).toEqual(["xapp-one", "xapp-three"]);
        expect(created.every((entry) => vi.mocked(entry.client.start).mock.calls.length === 1)).toBe(true);
    });

    it("opens and closes connections when the flows change", () => {
        const action = fakeAction([flow(1, "xapp-old", "SlackMessagePosted"), flow(2, "xapp-two", "SlackMessagePosted")]);
        const { created, createClient } = fakeClients();
        new SlackSocketManager(action, createClient).start();

        action.flows.set(1n, flow(1, "xapp-new", "SlackMessagePosted"));
        action.flows.delete(2n);
        action.emit(CodeZeroEvent.flowUpdated, action.flows.get(1n));

        expect(created.map((entry) => entry.appToken)).toEqual(["xapp-old", "xapp-two", "xapp-new"]);
        expect(created[0].client.disconnect).toHaveBeenCalled();
        expect(created[1].client.disconnect).toHaveBeenCalled();
        expect(created[2].client.disconnect).not.toHaveBeenCalled();
    });

    it("acknowledges a delivery and fires the matching flows of that app only", async () => {
        const action = fakeAction([
            flow(10, "xapp-one", "SlackMessagePosted"),
            flow(11, "xapp-one", "SlackMessagePosted", "C1"),
            flow(12, "xapp-one", "SlackMessagePosted", "C9"),
            flow(13, "xapp-one", "SlackAppMentioned"),
            flow(14, "xapp-two", "SlackMessagePosted"),
        ]);
        const manager = new SlackSocketManager(action, fakeClients().createClient);
        const delivery = eventsApi({ type: "message", channel: "C1", text: "hi", ts: "1712345678.123456" });

        await manager.handle("xapp-one", delivery);

        expect(delivery.ack).toHaveBeenCalledOnce();
        expect(action.fire.mock.calls.map(([flowId]) => flowId)).toEqual([10n, 11n]);
        expect(action.fire).toHaveBeenCalledWith(10n, {
            ...delivery.body,
            event: { ...delivery.body.event, ts: 1712345678123456 },
        });
    });

    it("fires reaction flows only for the selected message", async () => {
        const action = fakeAction([
            flow(10, "xapp-one", "SlackReactionAdded"),
            flow(11, "xapp-one", "SlackReactionAdded", undefined, "https://team.slack.com/archives/C1/p1712345678123456"),
            flow(12, "xapp-one", "SlackReactionAdded", "C1", "1712345678.123456"),
            flow(13, "xapp-one", "SlackReactionAdded", undefined, "1712345678.999999"),
            flow(14, "xapp-one", "SlackReactionAdded", "C9", "1712345678.123456"),
        ]);
        const manager = new SlackSocketManager(action, fakeClients().createClient);
        const delivery = eventsApi({
            type: "reaction_added",
            reaction: "white_check_mark",
            item: { type: "message", channel: "C1", ts: "1712345678.123456" },
        });

        await manager.handle("xapp-one", delivery);

        expect(action.fire.mock.calls.map(([flowId]) => flowId)).toEqual([10n, 11n, 12n]);
    });

    it("still acknowledges deliveries no flow is interested in", async () => {
        const action = fakeAction([flow(10, "xapp-one", "SlackMessagePosted")]);
        const manager = new SlackSocketManager(action, fakeClients().createClient);
        const delivery = eventsApi({ type: "message", channel: "C1", bot_id: "B1" });

        await manager.handle("xapp-one", delivery);

        expect(delivery.ack).toHaveBeenCalledOnce();
        expect(action.fire).not.toHaveBeenCalled();
    });

    it("routes deliveries from a connection to the flows of that app token", async () => {
        const action = fakeAction([flow(10, "xapp-one", "SlackSlashCommand"), flow(20, "xapp-two", "SlackSlashCommand")]);
        const { created, createClient } = fakeClients();
        new SlackSocketManager(action, createClient).start();

        created[1].deliver({
            ack: vi.fn(async () => undefined),
            type: "slash_commands",
            body: { command: "/deploy", channel_id: "C1" },
        });

        await vi.waitFor(() => expect(action.fire).toHaveBeenCalledOnce());
        expect(action.fire).toHaveBeenCalledWith(20n, { command: "/deploy", channel_id: "C1" });
    });
});
