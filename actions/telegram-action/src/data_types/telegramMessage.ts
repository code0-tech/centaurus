import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { TelegramUserSchema } from "./telegramUser.js";
import { TelegramChatSchema } from "./telegramChat.js";

export const TelegramMessageSchema = z.object({
    messageId: z.number(),
    chat: TelegramChatSchema,
    from: TelegramUserSchema.nullish(),
    date: z.string(),
    editDate: z.string().nullish(),
    text: z.string().nullish(),
    caption: z.string().nullish(),
    replyToMessageId: z.number().nullish(),
    /** The file id of the largest size of an attached photo. */
    photoFileId: z.string().nullish(),
    documentFileId: z.string().nullish(),
});
export type TelegramMessageType = z.infer<typeof TelegramMessageSchema>;

@Identifier("TELEGRAM_MESSAGE")
@Name({ code: "en-US", content: "Telegram Message" })
@DisplayMessage({ code: "en-US", content: "Telegram Message: ${messageId}" })
@Schema(TelegramMessageSchema)
export class TelegramMessage {}
