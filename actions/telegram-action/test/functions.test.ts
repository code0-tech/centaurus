import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RuntimeError } from "@code0-tech/hercules";

import { callTelegram } from "../src/api.js";
import { buildInlineKeyboard, mapTelegramCallbackQuery, mapTelegramMessage, ApiMessage } from "../src/helpers.js";
import { TelegramMessageSchema } from "../src/data_types/telegramMessage.js";
import { TelegramCallbackQuerySchema } from "../src/data_types/telegramCallbackQuery.js";

import { TelegramSendMessageFunction } from "../src/functions/telegramSendMessage.js";
import { TelegramSendPhotoFunction } from "../src/functions/telegramSendPhoto.js";
import { TelegramSendDocumentFunction } from "../src/functions/telegramSendDocument.js";
import { TelegramEditMessageTextFunction } from "../src/functions/telegramEditMessageText.js";
import { TelegramDeleteMessageFunction } from "../src/functions/telegramDeleteMessage.js";
import { TelegramAnswerCallbackQueryFunction } from "../src/functions/telegramAnswerCallbackQuery.js";
import { TelegramGetChatFunction } from "../src/functions/telegramGetChat.js";
import { TelegramGetMeFunction } from "../src/functions/telegramGetMe.js";

import { TelegramMessageReceived } from "../src/events/telegramMessageReceived.js";
import { TelegramCallbackQueryReceived } from "../src/events/telegramCallbackQueryReceived.js";

const TOKEN = "123456:ABC-secret-token";

const functions = [
    TelegramSendMessageFunction,
    TelegramSendPhotoFunction,
    TelegramSendDocumentFunction,
    TelegramEditMessageTextFunction,
    TelegramDeleteMessageFunction,
    TelegramAnswerCallbackQueryFunction,
    TelegramGetChatFunction,
    TelegramGetMeFunction,
];

const events = [TelegramMessageReceived, TelegramCallbackQueryReceived];

const apiMessage: ApiMessage = {
    message_id: 42,
    chat: { id: -1001234567890, type: "supergroup", title: "Team" },
    from: { id: 7, is_bot: false, first_name: "Ada", username: "ada" },
    date: 1700000000,
    text: "hello",
};

/** Parameter names in the order the signature lists them. */
function signatureNames(signature: string): string[] {
    const inner = signature.slice(signature.indexOf("(") + 1, signature.lastIndexOf("):"));
    return inner.split(/,\s*(?=\w+\??:)/).map((part) => part.split(/\??:/)[0].trim()).filter(Boolean);
}

describe("credentials", () => {
    it.each(functions)("%o takes the bot token first and no webhook secret", (fn) => {
        const parameters = Reflect.getMetadata("hercules:function_parameters", fn) as { runtimeName: string; optional?: boolean }[];
        const signature = Reflect.getMetadata("hercules:signature", fn) as string;

        expect(parameters[0].runtimeName).toEqual("botToken");
        expect(parameters[0].optional).not.toBe(true);
        expect(parameters.map((parameter) => parameter.runtimeName)).not.toContain("webhookSecret");
        expect(parameters.map((parameter) => parameter.runtimeName)).toEqual(signatureNames(signature));
    });

    it.each(events)("%o takes the bot token and an optional webhook secret", (event) => {
        const settings = Reflect.getMetadata("hercules:flow_settings", event) as { identifier: string; optional?: boolean }[];
        const signature = Reflect.getMetadata("hercules:signature", event) as string;

        expect(settings[0].identifier).toEqual("botToken");
        expect(settings[0].optional).not.toBe(true);
        expect(settings[1]).toMatchObject({ identifier: "webhookSecret", optional: true });
        expect(settings.map((setting) => setting.identifier)).toEqual(signatureNames(signature));
    });
});

describe("Bot API calls", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    function answer(result: unknown) {
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, result }), { status: 200 }));
    }

    function lastCall(): { url: string; body: Record<string, unknown> } {
        const [url, init] = fetchMock.mock.calls.at(-1)!;
        return { url, body: JSON.parse(init.body) };
    }

    it("sends a message with keyboard and reply, leaving out empty options", async () => {
        answer(apiMessage);

        const result = await new TelegramSendMessageFunction().run(
            null,
            TOKEN,
            "-1001234567890",
            "hello",
            undefined,
            [[{ text: "Yes", callbackData: "yes" }, { text: "Docs", url: "https://core.telegram.org" }]],
            41
        );

        const { url, body } = lastCall();
        expect(url).toEqual(`https://api.telegram.org/bot${TOKEN}/sendMessage`);
        expect(body).toEqual({
            chat_id: "-1001234567890",
            text: "hello",
            reply_markup: {
                inline_keyboard: [[{ text: "Yes", callback_data: "yes" }, { text: "Docs", url: "https://core.telegram.org" }]],
            },
            reply_parameters: { message_id: 41 },
        });
        expect(TelegramMessageSchema.parse(result)).toEqual(result);
        expect(result.chat.id).toEqual("-1001234567890");
    });

    it.each([
        [TelegramSendPhotoFunction, "sendPhoto", "photo"],
        [TelegramSendDocumentFunction, "sendDocument", "document"],
    ] as const)("%o sends the file by URL or file id", async (fn, method, field) => {
        answer(apiMessage);

        await new fn().run(null, TOKEN, "7", "https://example.com/file", "caption", "HTML");

        const { url, body } = lastCall();
        expect(url.endsWith(`/${method}`)).toBe(true);
        expect(body).toEqual({ chat_id: "7", [field]: "https://example.com/file", caption: "caption", parse_mode: "HTML" });
    });

    it("edits, deletes, answers and reads", async () => {
        answer({ ...apiMessage, text: "edited", edit_date: 1700000100 });
        const edited = await new TelegramEditMessageTextFunction().run(null, TOKEN, "7", 42, "edited", "MarkdownV2");
        expect(lastCall().body).toEqual({ chat_id: "7", message_id: 42, text: "edited", parse_mode: "MarkdownV2" });
        expect(edited.editDate).toEqual("2023-11-14T22:15:00.000Z");

        answer(true);
        expect(await new TelegramDeleteMessageFunction().run(null, TOKEN, "7", 42)).toBe(true);
        expect(lastCall().body).toEqual({ chat_id: "7", message_id: 42 });

        answer(true);
        await new TelegramAnswerCallbackQueryFunction().run(null, TOKEN, "q1", "Done", true);
        expect(lastCall().body).toEqual({ callback_query_id: "q1", text: "Done", show_alert: true });

        answer({ id: 7, type: "private", first_name: "Ada" });
        expect(await new TelegramGetChatFunction().run(null, TOKEN, "7")).toEqual({
            id: "7",
            type: "private",
            title: null,
            username: null,
            firstName: "Ada",
            lastName: null,
        });

        answer({ id: 123456, is_bot: true, first_name: "Bot", username: "my_bot" });
        expect(await new TelegramGetMeFunction().run(null, TOKEN)).toMatchObject({ id: "123456", isBot: true });
        expect(lastCall().url.endsWith("/getMe")).toBe(true);
    });

    it("surfaces retry_after of a rate limit", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    ok: false,
                    error_code: 429,
                    description: "Too Many Requests: retry after 17",
                    parameters: { retry_after: 17 },
                }),
                { status: 429 }
            )
        );

        const error = await rejection(callTelegram(TOKEN, "sendMessage"));
        expect(error).toBeInstanceOf(RuntimeError);
        expect(error.code).toEqual("TELEGRAM_RATE_LIMITED");
        expect(error.description).toContain("17 seconds");
    });

    it("maps a rejected token and never leaks it", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ ok: false, error_code: 401, description: "Unauthorized" }), { status: 401 })
        );
        const unauthorized = await rejection(callTelegram(TOKEN, "getMe"));
        expect(unauthorized.code).toEqual("TELEGRAM_UNAUTHORIZED");

        fetchMock.mockRejectedValueOnce(new TypeError(`fetch failed for https://api.telegram.org/bot${TOKEN}/getMe`));
        const network = await rejection(callTelegram(TOKEN, "getMe"));
        expect(network.code).toEqual("TELEGRAM_REQUEST_FAILED");

        for (const error of [unauthorized, network]) {
            expect(`${error.message} ${error.description}`).not.toContain(TOKEN);
        }
    });

    it("requires a bot token", async () => {
        const error = await rejection(callTelegram("  ", "getMe"));
        expect(error.code).toEqual("TELEGRAM_MISSING_BOT_TOKEN");
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe("inline keyboard", () => {
    it("is undefined without buttons", () => {
        expect(buildInlineKeyboard(undefined)).toBeUndefined();
        expect(buildInlineKeyboard([[], []])).toBeUndefined();
    });

    it("rejects buttons Telegram would refuse", () => {
        expect(() => buildInlineKeyboard([[{ text: "x" }]])).toThrow(RuntimeError);
        expect(() => buildInlineKeyboard([[{ text: "x", url: "https://a", callbackData: "b" }]])).toThrow(RuntimeError);
        expect(() => buildInlineKeyboard([[{ text: "x", callbackData: "a".repeat(65) }]])).toThrow(RuntimeError);
        expect(() => buildInlineKeyboard([[{ text: " ", callbackData: "a" }]])).toThrow(RuntimeError);
    });
});

describe("mappers", () => {
    it("fills every field of a message, picking the largest photo", () => {
        const message = mapTelegramMessage({
            ...apiMessage,
            text: undefined,
            caption: "look",
            reply_to_message: { message_id: 40 },
            photo: [
                { file_id: "small", width: 90, height: 90 },
                { file_id: "large", width: 1280, height: 1280 },
                { file_id: "medium", width: 320, height: 320 },
            ],
        });

        expect(message).toEqual({
            messageId: 42,
            chat: { id: "-1001234567890", type: "supergroup", title: "Team", username: null, firstName: null, lastName: null },
            from: { id: "7", isBot: false, firstName: "Ada", lastName: null, username: "ada", languageCode: null },
            date: "2023-11-14T22:13:20.000Z",
            editDate: null,
            text: null,
            caption: "look",
            replyToMessageId: 40,
            photoFileId: "large",
            documentFileId: null,
        });
    });

    it("maps a callback query", () => {
        const query = mapTelegramCallbackQuery({
            id: "q1",
            from: { id: 7, is_bot: false, first_name: "Ada" },
            message: apiMessage,
            chat_instance: "ci",
            data: "yes",
        });

        expect(TelegramCallbackQuerySchema.parse(query)).toEqual(query);
        expect(query).toMatchObject({ id: "q1", data: "yes", inlineMessageId: null, message: { messageId: 42 } });
    });
});

async function rejection(promise: Promise<unknown>): Promise<any> {
    try {
        await promise;
    } catch (error) {
        return error;
    }
    throw new Error("Expected the promise to reject.");
}
