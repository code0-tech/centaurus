import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Action } from "@code0-tech/hercules";

import { ApiUpdate } from "../src/helpers.js";
import { EventBridge, webhookConfigFromEnv } from "../src/eventBridge.js";
import {
    ActionFlow,
    deriveSecret,
    matchingFlows,
    planWebhooks,
    resolveWebhookRequest,
    webhookPath,
} from "../src/webhook.js";

const TOKEN = "123456:ABC-secret-token";
const OTHER_TOKEN = "654321:XYZ-other-token";

let nextFlowId = 1;

function flow(type: string, settings: Record<string, string | undefined>): ActionFlow {
    return {
        flowId: BigInt(nextFlowId++),
        type,
        settings: Object.entries(settings).map(([flowSettingId, value]) => ({
            flowSettingId,
            value: value === undefined ? undefined : { kind: { oneofKind: "stringValue", stringValue: value } },
        })),
    } as unknown as ActionFlow;
}

const messageUpdate = (chatId: number): ApiUpdate => ({
    update_id: 1,
    message: {
        message_id: 1,
        chat: { id: chatId, type: "private", first_name: "Ada" },
        from: { id: chatId, is_bot: false, first_name: "Ada" },
        date: 1700000000,
        text: "hi",
    },
});

const callbackUpdate = (data: string): ApiUpdate => ({
    update_id: 2,
    callback_query: {
        id: "q1",
        from: { id: 7, is_bot: false, first_name: "Ada" },
        message: messageUpdate(7).message,
        chat_instance: "ci",
        data,
    },
});

const silent = () => {};

describe("webhook plan", () => {
    it("registers one webhook per bot, with a derived secret when none is set", () => {
        const webhooks = planWebhooks(
            [
                flow("TelegramMessageReceived", { botToken: TOKEN }),
                flow("TelegramCallbackQuery", { botToken: TOKEN, webhookSecret: "" }),
                flow("TelegramMessageReceived", { botToken: OTHER_TOKEN }),
                flow("SomethingElse", { botToken: TOKEN }),
            ],
            silent
        );

        expect(webhooks.size).toBe(2);
        const webhook = webhooks.get(webhookPath(TOKEN))!;
        expect(webhook.secret).toEqual(deriveSecret(TOKEN));
        expect(webhook.secret).toMatch(/^[A-Za-z0-9_-]{1,256}$/);
        expect(webhook.flows).toHaveLength(2);
        expect(webhook.path).not.toContain(TOKEN);
        expect(deriveSecret(TOKEN)).not.toEqual(deriveSecret(OTHER_TOKEN));
    });

    it("uses the secret a flow sets and skips flows that disagree or are invalid", () => {
        const warn = vi.fn();
        const first = flow("TelegramMessageReceived", { botToken: TOKEN, webhookSecret: "first-secret" });
        const wildcard = flow("TelegramMessageReceived", { botToken: TOKEN });
        const conflicting = flow("TelegramMessageReceived", { botToken: TOKEN, webhookSecret: "other-secret" });
        const invalid = flow("TelegramMessageReceived", { botToken: TOKEN, webhookSecret: "not allowed!" });
        const tokenless = flow("TelegramMessageReceived", {});

        const webhook = planWebhooks([conflicting, invalid, wildcard, first, tokenless], warn).get(webhookPath(TOKEN))!;

        expect(webhook.secret).toEqual("first-secret");
        expect(webhook.flows).toEqual([first, wildcard]);
        expect(warn).toHaveBeenCalledTimes(3);
    });
});

describe("webhook requests", () => {
    const webhooks = planWebhooks(
        [flow("TelegramMessageReceived", { botToken: TOKEN, webhookSecret: "s3cret" })],
        silent
    );
    const url = `/telegram-prefix${webhookPath(TOKEN)}`;
    const body = JSON.stringify(messageUpdate(7));

    it("accepts an update with the bot's secret", () => {
        const result = resolveWebhookRequest({ method: "POST", url, secret: "s3cret", body }, webhooks);

        expect(result.status).toBe(200);
        if (result.status === 200) expect(result.update.message?.text).toEqual("hi");
    });

    it("rejects a missing or wrong secret", () => {
        expect(resolveWebhookRequest({ method: "POST", url, body }, webhooks).status).toBe(401);
        expect(resolveWebhookRequest({ method: "POST", url, secret: "s3cre", body }, webhooks).status).toBe(401);
        expect(resolveWebhookRequest({ method: "POST", url, secret: "s3cretX", body }, webhooks).status).toBe(401);
    });

    it("rejects unknown bots, other methods and bodies that are no update", () => {
        expect(resolveWebhookRequest({ method: "POST", url: webhookPath(OTHER_TOKEN), secret: "s3cret", body }, webhooks).status).toBe(404);
        expect(resolveWebhookRequest({ method: "GET", url, secret: "s3cret", body: "" }, webhooks).status).toBe(405);
        expect(resolveWebhookRequest({ method: "POST", url, secret: "s3cret", body: "{" }, webhooks).status).toBe(400);
        expect(resolveWebhookRequest({ method: "POST", url, secret: "s3cret", body: "{}" }, webhooks).status).toBe(400);
    });
});

describe("matching flows", () => {
    it("filters messages by chat and callback queries by chat and data", () => {
        const anyChat = flow("TelegramMessageReceived", { botToken: TOKEN });
        const chat7 = flow("TelegramMessageReceived", { botToken: TOKEN, chatId: "7" });
        const chat8 = flow("TelegramMessageReceived", { botToken: TOKEN, chatId: "8" });
        const anyButton = flow("TelegramCallbackQuery", { botToken: TOKEN });
        const yesButton = flow("TelegramCallbackQuery", { botToken: TOKEN, data: "yes" });
        const webhook = planWebhooks([anyChat, chat7, chat8, anyButton, yesButton], silent).get(webhookPath(TOKEN))!;

        expect(matchingFlows(webhook, messageUpdate(7))?.flows).toEqual([anyChat, chat7]);
        expect(matchingFlows(webhook, callbackUpdate("yes"))?.flows).toEqual([anyButton, yesButton]);
        expect(matchingFlows(webhook, callbackUpdate("no"))?.flows).toEqual([anyButton]);
        expect(matchingFlows(webhook, { update_id: 3 })).toBeUndefined();
    });
});

describe("event bridge", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, result: true }), { status: 200 }));
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    function fakeAction(flows: ActionFlow[]) {
        return {
            flows: { values: () => flows },
            fire: vi.fn(async () => null),
        } as unknown as Action & { fire: ReturnType<typeof vi.fn> };
    }

    function calls(): { method: string; body: Record<string, unknown> }[] {
        return fetchMock.mock.calls.map(([url, init]: any[]) => ({
            method: url.split("/").at(-1)!,
            body: JSON.parse(String(init.body)),
        }));
    }

    it("registers webhooks once and removes the ones no flow uses anymore", async () => {
        const flows = [flow("TelegramMessageReceived", { botToken: TOKEN, webhookSecret: "s3cret" })];
        const action = fakeAction(flows);
        const bridge = new EventBridge(action, { publicUrl: "https://bots.example.com", host: "0.0.0.0", port: 0 });

        await bridge.sync();
        await bridge.sync();
        expect(calls()).toEqual([
            {
                method: "setWebhook",
                body: {
                    url: `https://bots.example.com${webhookPath(TOKEN)}`,
                    secret_token: "s3cret",
                    allowed_updates: ["message", "callback_query"],
                },
            },
        ]);

        flows.length = 0;
        await bridge.sync();
        expect(calls().at(-1)).toEqual({ method: "deleteWebhook", body: {} });
    });

    it("does not touch Telegram without a public URL", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const bridge = new EventBridge(fakeAction([flow("TelegramMessageReceived", { botToken: TOKEN })]), {
            host: "0.0.0.0",
            port: 0,
        });

        await bridge.sync();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledOnce();
        warn.mockRestore();
    });

    it("fires the matching flows with the mapped payload", async () => {
        const target = flow("TelegramMessageReceived", { botToken: TOKEN, chatId: "7" });
        const action = fakeAction([target, flow("TelegramMessageReceived", { botToken: TOKEN, chatId: "8" })]);
        const bridge = new EventBridge(action, { host: "0.0.0.0", port: 0 });
        const webhook = planWebhooks(action.flows.values(), silent).get(webhookPath(TOKEN))!;

        await bridge.dispatch(webhook, messageUpdate(7));

        expect(action.fire).toHaveBeenCalledOnce();
        expect(action.fire).toHaveBeenCalledWith(target.flowId, expect.objectContaining({ messageId: 1, text: "hi" }));
    });

    it("reads its configuration from the environment", () => {
        expect(webhookConfigFromEnv({})).toEqual({ publicUrl: undefined, host: "0.0.0.0", port: 8080 });
        expect(webhookConfigFromEnv({ TELEGRAM_WEBHOOK_URL: "https://bots.example.com/", TELEGRAM_WEBHOOK_PORT: "8443" })).toEqual({
            publicUrl: "https://bots.example.com",
            host: "0.0.0.0",
            port: 8443,
        });
        expect(() => webhookConfigFromEnv({ TELEGRAM_WEBHOOK_PORT: "abc" })).toThrow();
    });
});
