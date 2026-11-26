import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { callTelegram } from "../api.js";
import { ApiMessage, buildInlineKeyboard, mapTelegramMessage, replyParameters } from "../helpers.js";
import { TelegramMessageType } from "../data_types/telegramMessage.js";
import { TelegramInlineKeyboardButtonType } from "../data_types/telegramInlineKeyboardButton.js";
import {
    BotTokenParameter,
    ChatIdParameter,
    InlineKeyboardParameter,
    ParseMode,
    ParseModeParameter,
    ReplyToMessageIdParameter,
} from "../settings.js";

@Identifier("telegramSendMessage")
@Signature(
    '(botToken: string, chatId: string, text: string, parseMode?: "MarkdownV2"|"HTML", inlineKeyboard?: TELEGRAM_INLINE_KEYBOARD_BUTTON[][], replyToMessageId?: number): TELEGRAM_MESSAGE'
)
@Name({ code: "en-US", content: "Send message" })
@DisplayIcon("simple:telegram")
@DisplayMessage({ code: "en-US", content: "Send Telegram message to ${chatId}" })
@Documentation({
    code: "en-US",
    content: "Sends a text message to a Telegram chat, optionally formatted, with an inline keyboard, or as a reply.",
})
@Description({ code: "en-US", content: "Send a text message to a chat." })
@BotTokenParameter
@ChatIdParameter
@Parameter({
    runtimeName: "text",
    name: [{ code: "en-US", content: "Text" }],
    description: [{ code: "en-US", content: "The text of the message, 1-4096 characters." }],
})
@ParseModeParameter
@InlineKeyboardParameter
@ReplyToMessageIdParameter
export class TelegramSendMessageFunction {
    async run(
        _context: unknown,
        botToken: string,
        chatId: string,
        text: string,
        parseMode?: ParseMode,
        inlineKeyboard?: TelegramInlineKeyboardButtonType[][],
        replyToMessageId?: number
    ): Promise<TelegramMessageType> {
        const message = await callTelegram<ApiMessage>(botToken, "sendMessage", {
            chat_id: chatId,
            text,
            parse_mode: parseMode,
            reply_markup: buildInlineKeyboard(inlineKeyboard),
            reply_parameters: replyParameters(replyToMessageId),
        });
        return mapTelegramMessage(message);
    }
}
