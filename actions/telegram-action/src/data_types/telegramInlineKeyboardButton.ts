import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * A button of an inline keyboard. Exactly one of `callbackData` (the button
 * fires `TelegramCallbackQuery`) or `url` (the button opens a link) is used.
 */
export const TelegramInlineKeyboardButtonSchema = z.object({
    text: z.string(),
    callbackData: z.string().nullish(),
    url: z.string().nullish(),
});
export type TelegramInlineKeyboardButtonType = z.infer<typeof TelegramInlineKeyboardButtonSchema>;

@Identifier("TELEGRAM_INLINE_KEYBOARD_BUTTON")
@Name({ code: "en-US", content: "Telegram Inline Keyboard Button" })
@DisplayMessage({ code: "en-US", content: "Button: ${text}" })
@Schema(TelegramInlineKeyboardButtonSchema)
export class TelegramInlineKeyboardButton {}
