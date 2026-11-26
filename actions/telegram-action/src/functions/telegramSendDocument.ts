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

@Identifier("telegramSendDocument")
@Signature(
    '(botToken: string, chatId: string, document: string, caption?: string, parseMode?: "MarkdownV2"|"HTML", inlineKeyboard?: TELEGRAM_INLINE_KEYBOARD_BUTTON[][], replyToMessageId?: number): TELEGRAM_MESSAGE'
)
@Name({ code: "en-US", content: "Send document" })
@DisplayIcon("simple:telegram")
@DisplayMessage({ code: "en-US", content: "Send Telegram document to ${chatId}" })
@Documentation({
    code: "en-US",
    content:
        "Sends a file to a Telegram chat. The file is an HTTP URL Telegram downloads it from (up to 20 MB), or the file id of a file Telegram already has.",
})
@Description({ code: "en-US", content: "Send a document to a chat." })
@BotTokenParameter
@ChatIdParameter
@Parameter({
    runtimeName: "document",
    name: [{ code: "en-US", content: "Document" }],
    description: [{ code: "en-US", content: "An HTTP URL of the file, or the file id of a file already on Telegram." }],
})
@Parameter({
    runtimeName: "caption",
    name: [{ code: "en-US", content: "Caption" }],
    description: [{ code: "en-US", content: "The caption shown with the document, 0-1024 characters." }],
    optional: true,
})
@ParseModeParameter
@InlineKeyboardParameter
@ReplyToMessageIdParameter
export class TelegramSendDocumentFunction {
    async run(
        _context: unknown,
        botToken: string,
        chatId: string,
        document: string,
        caption?: string,
        parseMode?: ParseMode,
        inlineKeyboard?: TelegramInlineKeyboardButtonType[][],
        replyToMessageId?: number
    ): Promise<TelegramMessageType> {
        const message = await callTelegram<ApiMessage>(botToken, "sendDocument", {
            chat_id: chatId,
            document,
            caption,
            parse_mode: parseMode,
            reply_markup: buildInlineKeyboard(inlineKeyboard),
            reply_parameters: replyParameters(replyToMessageId),
        });
        return mapTelegramMessage(message);
    }
}
