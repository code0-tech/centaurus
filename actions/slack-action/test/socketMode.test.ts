import "reflect-metadata";
import { EventEmitter } from "node:events";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";
import type { ActionFlow } from "@code0-tech/tucana/aquila";
import { constructValue } from "@code0-tech/tucana/helpers";
import { describe, expect, it, vi } from "vitest";
import { normalizeMessageTs, routeDelivery, SlackSocketClient, SlackSocketDelivery, SlackSocketManager } from "../src/socketMode.js";

const flow = (flowId: number, projectId: number, type: string, channelId?: string, messageTs?: string): ActionFlow =>
    ({
        flowId: BigInt(flowId),
        projectId: BigInt(projectId),
        type,
        settings: [
            ...(channelId === undefined ? [] : [{ flowSettingId: "channelId", value: constructValue(channelId) }]),
            ...(messageTs === undefined ? [] : [{ flowSettingId: "messageTs", value: constructValue(messageTs) }]),
        ],
    }) as unknown as ActionFlow;

/** Just enough of an Action: configs per project, flows, events and fire. */
function fakeAction(appTokens: Record<number, string>, flows: ActionFlow[] = []) {
    const emitter = new EventEmitter();
    const configs = new Map(
        Object.entries(appTokens).map(([projectId, appToken]) => [
            BigInt(projectId),
            {
                projectId: BigInt(projectId),
                configValues: [],
                findConfig: (identifier: string) => (identifier === "app_token" ? appToken : undefined),
            },
        ])
    );
    const action = {
        configs,
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

describe("SlackSocketManager", () => {
    it("opens one connection per project with an app token", () => {
        const action = fakeAction({ 1: "xapp-one", 2: "", 3: "xapp-three" });
        const { created, createClient } = fakeClients();

        new SlackSocketManager(action, createClient).start();

        expect(created.map((entry) => entry.appToken)).toEqual(["xapp-one", "xapp-three"]);
        expect(created.every((entry) => vi.mocked(entry.client.start).mock.calls.length === 1)).toBe(true);
    });

    it("replaces and closes connections when the configuration changes", () => {
        const action = fakeAction({ 1: "xapp-old", 2: "xapp-two" });
        const { created, createClient } = fakeClients();
        new SlackSocketManager(action, createClient).start();

        action.configs.get(1n)!.findConfig = (identifier: string) => (identifier === "app_token" ? "xapp-new" : undefined);
        action.configs.delete(2n);
        action.emit(CodeZeroEvent.moduleUpdated, {});

        expect(created.map((entry) => entry.appToken)).toEqual(["xapp-old", "xapp-two", "xapp-new"]);
        expect(created[0].client.disconnect).toHaveBeenCalled();
        expect(created[1].client.disconnect).toHaveBeenCalled();
        expect(created[2].client.disconnect).not.toHaveBeenCalled();
    });

    it("acknowledges a delivery and fires the matching flows of that project only", async () => {
        const action = fakeAction({ 1: "xapp-one" }, [
            flow(10, 1, "SlackMessagePosted"),
            flow(11, 1, "SlackMessagePosted", "C1"),
            flow(12, 1, "SlackMessagePosted", "C9"),
            flow(13, 1, "SlackAppMentioned"),
            flow(14, 2, "SlackMessagePosted"),
        ]);
        const manager = new SlackSocketManager(action, fakeClients().createClient);
        const delivery = eventsApi({ type: "message", channel: "C1", text: "hi", ts: "1.2" });

        await manager.handle(1n, delivery);

        expect(delivery.ack).toHaveBeenCalledOnce();
        expect(action.fire.mock.calls.map(([flowId]) => flowId)).toEqual([10n, 11n]);
        expect(action.fire).toHaveBeenCalledWith(10n, delivery.body);
    });

    it("fires reaction flows only for the selected message", async () => {
        const action = fakeAction({ 1: "xapp-one" }, [
            flow(10, 1, "SlackReactionAdded"),
            flow(11, 1, "SlackReactionAdded", undefined, "https://team.slack.com/archives/C1/p1712345678123456"),
            flow(12, 1, "SlackReactionAdded", "C1", "1712345678.123456"),
            flow(13, 1, "SlackReactionAdded", undefined, "1712345678.999999"),
            flow(14, 1, "SlackReactionAdded", "C9", "1712345678.123456"),
        ]);
        const manager = new SlackSocketManager(action, fakeClients().createClient);
        const delivery = eventsApi({
            type: "reaction_added",
            reaction: "white_check_mark",
            item: { type: "message", channel: "C1", ts: "1712345678.123456" },
        });

        await manager.handle(1n, delivery);

        expect(action.fire.mock.calls.map(([flowId]) => flowId)).toEqual([10n, 11n, 12n]);
    });

    it("still acknowledges deliveries no flow is interested in", async () => {
        const action = fakeAction({ 1: "xapp-one" }, [flow(10, 1, "SlackMessagePosted")]);
        const manager = new SlackSocketManager(action, fakeClients().createClient);
        const delivery = eventsApi({ type: "message", channel: "C1", bot_id: "B1" });

        await manager.handle(1n, delivery);

        expect(delivery.ack).toHaveBeenCalledOnce();
        expect(action.fire).not.toHaveBeenCalled();
    });

    it("routes deliveries from a connection to that connection's project", async () => {
        const action = fakeAction({ 1: "xapp-one", 2: "xapp-two" }, [
            flow(10, 1, "SlackSlashCommand"),
            flow(20, 2, "SlackSlashCommand"),
        ]);
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
