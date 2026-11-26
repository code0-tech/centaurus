import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { callTelegram } from "../api.js";
import { BotTokenParameter } from "../settings.js";

@Identifier("telegramAnswerCallbackQuery")
@Signature("(botToken: string, callbackQueryId: string, text?: string, showAlert?: boolean): boolean")
@Name({ code: "en-US", content: "Answer callback query" })
@DisplayIcon("simple:telegram")
@DisplayMessage({ code: "en-US", content: "Answer Telegram callback query" })
@Documentation({
    code: "en-US",
    content:
        "Answers the press of an inline keyboard button. Telegram shows a loading indicator on the button until it is answered, so every flow started by a callback query should call this - optionally with a notification for the user.",
})
@Description({ code: "en-US", content: "Answer an inline keyboard button press." })
@BotTokenParameter
@Parameter({
    runtimeName: "callbackQueryId",
    name: [{ code: "en-US", content: "Callback query ID" }],
    description: [
        { code: "en-US", content: "The id of the callback query, as the Telegram callback query event delivers it." },
    ],
})
@Parameter({
    runtimeName: "text",
    name: [{ code: "en-US", content: "Text" }],
    description: [{ code: "en-US", content: "A notification shown to the user, 0-200 characters. Empty shows nothing." }],
    optional: true,
})
@Parameter({
    runtimeName: "showAlert",
    name: [{ code: "en-US", content: "Show alert" }],
    description: [
        {
            code: "en-US",
            content: "Show the text as an alert the user has to dismiss instead of a notification at the top.",
        },
    ],
    optional: true,
})
export class TelegramAnswerCallbackQueryFunction {
    async run(
        _context: unknown,
        botToken: string,
        callbackQueryId: string,
        text?: string,
        showAlert?: boolean
    ): Promise<boolean> {
        return callTelegram<boolean>(botToken, "answerCallbackQuery", {
            callback_query_id: callbackQueryId,
            text,
            show_alert: showAlert,
        });
    }
}
