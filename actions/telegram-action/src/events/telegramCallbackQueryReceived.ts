import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";
import { BotTokenSetting, ChatIdSetting, WebhookSecretSetting } from "../settings.js";

@Identifier("TelegramCallbackQuery")
@DisplayIcon("simple:telegram")
@Name({ code: "en-US", content: "Telegram button pressed" })
@Description({
    code: "en-US",
    content:
        "Triggered when a user presses an inline keyboard button with callback data. Answer it with telegramAnswerCallbackQuery.",
})
@DisplayMessage({ code: "en-US", content: "Telegram button pressed" })
@Signature("(botToken: string, webhookSecret?: string, chatId?: string, data?: string): TELEGRAM_CALLBACK_QUERY")
@BotTokenSetting
@WebhookSecretSetting
@ChatIdSetting
@EventSetting({
    identifier: "data",
    name: [{ code: "en-US", content: "Callback data" }],
    description: [
        { code: "en-US", content: "Only react to buttons with exactly this callback data. Empty reacts to every button." },
    ],
    optional: true,
})
export class TelegramCallbackQueryReceived {}
