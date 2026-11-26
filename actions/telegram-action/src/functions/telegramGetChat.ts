import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Signature } from "@code0-tech/hercules";
import { callTelegram } from "../api.js";
import { ApiChat, mapTelegramChat } from "../helpers.js";
import { TelegramChatDataType } from "../data_types/telegramChat.js";
import { BotTokenParameter, ChatIdParameter } from "../settings.js";

@Identifier("telegramGetChat")
@Signature("(botToken: string, chatId: string): TELEGRAM_CHAT")
@Name({ code: "en-US", content: "Get chat" })
@DisplayIcon("simple:telegram")
@DisplayMessage({ code: "en-US", content: "Get Telegram chat ${chatId}" })
@Documentation({ code: "en-US", content: "Reads a chat the bot is a member of, or a public channel." })
@Description({ code: "en-US", content: "Read a chat." })
@BotTokenParameter
@ChatIdParameter
export class TelegramGetChatFunction {
    async run(_context: unknown, botToken: string, chatId: string): Promise<TelegramChatDataType> {
        return mapTelegramChat(await callTelegram<ApiChat>(botToken, "getChat", { chat_id: chatId }));
    }
}
