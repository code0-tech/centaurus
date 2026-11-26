import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { TelegramUserSchema } from "./telegramUser.js";
import { TelegramMessageSchema } from "./telegramMessage.js";

export const TelegramCallbackQuerySchema = z.object({
    id: z.string(),
    from: TelegramUserSchema,
    /** The message the pressed button belongs to. */
    message: TelegramMessageSchema.nullish(),
    inlineMessageId: z.string().nullish(),
    chatInstance: z.string(),
    /** The callback data of the pressed button. */
    data: z.string().nullish(),
});
export type TelegramCallbackQueryType = z.infer<typeof TelegramCallbackQuerySchema>;

@Identifier("TELEGRAM_CALLBACK_QUERY")
@Name({ code: "en-US", content: "Telegram Callback Query" })
@DisplayMessage({ code: "en-US", content: "Telegram Callback Query: ${data}" })
@Schema(TelegramCallbackQuerySchema)
export class TelegramCallbackQuery {}
