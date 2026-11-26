import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { callTelegram } from "../api.js";
import { ApiMessage, buildInlineKeyboard, mapTelegramMessage } from "../helpers.js";
import { TelegramMessageType } from "../data_types/telegramMessage.js";
import { TelegramInlineKeyboardButtonType } from "../data_types/telegramInlineKeyboardButton.js";
import {
    BotTokenParameter,
    ChatIdParameter,
    InlineKeyboardParameter,
    MessageIdParameter,
    ParseMode,
    ParseModeParameter,
} from "../settings.js";

@Identifier("telegramEditMessageText")
@Signature(
    '(botToken: string, chatId: string, messageId: number, text: string, parseMode?: "MarkdownV2"|"HTML", inlineKeyboard?: TELEGRAM_INLINE_KEYBOARD_BUTTON[][]): TELEGRAM_MESSAGE'
)
@Name({ code: "en-US", content: "Edit message text" })
@DisplayIcon("simple:telegram")
@DisplayMessage({ code: "en-US", content: "Edit Telegram message ${messageId}" })
@Documentation({
    code: "en-US",
    content:
        "Replaces the text of a message the bot sent. Without an inline keyboard, a keyboard the message had is removed.",
})
@Description({ code: "en-US", content: "Edit the text of a message." })
@BotTokenParameter
@ChatIdParameter
@MessageIdParameter
@Parameter({
    runtimeName: "text",
    name: [{ code: "en-US", content: "Text" }],
    description: [{ code: "en-US", content: "The new text of the message, 1-4096 characters." }],
})
@ParseModeParameter
@InlineKeyboardParameter
export class TelegramEditMessageTextFunction {
    async run(
        _context: unknown,
        botToken: string,
        chatId: string,
        messageId: number,
        text: string,
        parseMode?: ParseMode,
        inlineKeyboard?: TelegramInlineKeyboardButtonType[][]
    ): Promise<TelegramMessageType> {
        const message = await callTelegram<ApiMessage>(botToken, "editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text,
            parse_mode: parseMode,
            reply_markup: buildInlineKeyboard(inlineKeyboard),
        });
        return mapTelegramMessage(message);
    }
}
