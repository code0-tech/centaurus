import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Signature } from "@code0-tech/hercules";
import { BotTokenSetting, ChatIdSetting, WebhookSecretSetting } from "../settings.js";

@Identifier("TelegramMessageReceived")
@DisplayIcon("simple:telegram")
@Name({ code: "en-US", content: "Telegram message received" })
@Description({
    code: "en-US",
    content: "Triggered when the bot receives a new message - in a private chat, or in a group the bot can read.",
})
@DisplayMessage({ code: "en-US", content: "Telegram message received" })
@Signature("(botToken: string, webhookSecret?: string, chatId?: string): TELEGRAM_MESSAGE")
@BotTokenSetting
@WebhookSecretSetting
@ChatIdSetting
export class TelegramMessageReceived {}
