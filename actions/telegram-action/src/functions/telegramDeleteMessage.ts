import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Signature } from "@code0-tech/hercules";
import { callTelegram } from "../api.js";
import { BotTokenParameter, ChatIdParameter, MessageIdParameter } from "../settings.js";

@Identifier("telegramDeleteMessage")
@Signature("(botToken: string, chatId: string, messageId: number): boolean")
@Name({ code: "en-US", content: "Delete message" })
@DisplayIcon("simple:telegram")
@DisplayMessage({ code: "en-US", content: "Delete Telegram message ${messageId}" })
@Documentation({
    code: "en-US",
    content:
        "Deletes a message. A bot can delete its own messages, and in groups the messages of others when it is an admin allowed to delete messages. Telegram refuses to delete messages older than 48 hours.",
})
@Description({ code: "en-US", content: "Delete a message." })
@BotTokenParameter
@ChatIdParameter
@MessageIdParameter
export class TelegramDeleteMessageFunction {
    async run(_context: unknown, botToken: string, chatId: string, messageId: number): Promise<boolean> {
        return callTelegram<boolean>(botToken, "deleteMessage", { chat_id: chatId, message_id: messageId });
    }
}
