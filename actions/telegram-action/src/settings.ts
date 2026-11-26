import { EventSetting, Parameter } from "@code0-tech/hercules";

/**
 * The fields functions and events share. A field both use (the bot token, the
 * chat id) is described here once and handed out as a function parameter as
 * well as an event setting.
 *
 * The action holds no credentials of its own: functions take the bot token as
 * their first parameter, events take it - and the webhook secret, which only
 * events need - as settings.
 */

// Shared by functions and events.

const botToken = {
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Telegram bot, as issued by @BotFather." }],
};

export const BotTokenParameter = Parameter({ runtimeName: "botToken", ...botToken });
export const BotTokenSetting = EventSetting({ identifier: "botToken", ...botToken });

export const ChatIdParameter = Parameter({
    runtimeName: "chatId",
    name: [{ code: "en-US", content: "Chat ID" }],
    description: [
        {
            code: "en-US",
            content: "The ID of the target chat, or the username of a channel (in the format @channelusername).",
        },
    ],
});

export const ChatIdSetting = EventSetting({
    identifier: "chatId",
    name: [{ code: "en-US", content: "Chat ID" }],
    description: [{ code: "en-US", content: "Only react to updates from this chat. Empty reacts to every chat." }],
    optional: true,
});

// Events only.

export const WebhookSecretSetting = EventSetting({
    identifier: "webhookSecret",
    name: [{ code: "en-US", content: "Webhook secret" }],
    description: [
        {
            code: "en-US",
            content:
                "The secret Telegram sends with every update (X-Telegram-Bot-Api-Secret-Token); updates without it are rejected. 1-256 characters of A-Z, a-z, 0-9, _ and -. Empty derives a secret from the bot token.",
        },
    ],
    optional: true,
});

// Functions only.

export const MessageIdParameter = Parameter({
    runtimeName: "messageId",
    name: [{ code: "en-US", content: "Message ID" }],
    description: [{ code: "en-US", content: "The ID of the message." }],
});

export const ParseModeParameter = Parameter({
    runtimeName: "parseMode",
    name: [{ code: "en-US", content: "Parse mode" }],
    description: [
        { code: "en-US", content: "How Telegram formats the text: MarkdownV2 or HTML. Empty sends plain text." },
    ],
    optional: true,
});

export const InlineKeyboardParameter = Parameter({
    runtimeName: "inlineKeyboard",
    name: [{ code: "en-US", content: "Inline keyboard" }],
    description: [
        {
            code: "en-US",
            content:
                "Rows of buttons shown below the message. A button with callback data fires the Telegram callback query event when pressed.",
        },
    ],
    optional: true,
});

export const ReplyToMessageIdParameter = Parameter({
    runtimeName: "replyToMessageId",
    name: [{ code: "en-US", content: "Reply to message ID" }],
    description: [{ code: "en-US", content: "The ID of a message in the same chat to reply to." }],
    optional: true,
});

export type ParseMode = "MarkdownV2" | "HTML";
