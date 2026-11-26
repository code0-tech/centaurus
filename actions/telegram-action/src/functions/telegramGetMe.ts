import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Signature } from "@code0-tech/hercules";
import { callTelegram } from "../api.js";
import { ApiUser, mapTelegramUser } from "../helpers.js";
import { TelegramUserType } from "../data_types/telegramUser.js";
import { BotTokenParameter } from "../settings.js";

@Identifier("telegramGetMe")
@Signature("(botToken: string): TELEGRAM_USER")
@Name({ code: "en-US", content: "Get bot" })
@DisplayIcon("simple:telegram")
@DisplayMessage({ code: "en-US", content: "Get Telegram bot" })
@Documentation({
    code: "en-US",
    content:
        "Reads the bot the token belongs to. Fails with TELEGRAM_UNAUTHORIZED for an invalid token, so it doubles as a credential check.",
})
@Description({ code: "en-US", content: "Read the bot behind a token." })
@BotTokenParameter
export class TelegramGetMeFunction {
    async run(_context: unknown, botToken: string): Promise<TelegramUserType> {
        return mapTelegramUser(await callTelegram<ApiUser>(botToken, "getMe"));
    }
}
