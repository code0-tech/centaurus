import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const TelegramChatTypeEnum = z.enum(["private", "group", "supergroup", "channel"]);
export type TelegramChatTypeType = z.infer<typeof TelegramChatTypeEnum>;

export const TelegramChatSchema = z.object({
    id: z.string(),
    type: TelegramChatTypeEnum,
    title: z.string().nullish(),
    username: z.string().nullish(),
    firstName: z.string().nullish(),
    lastName: z.string().nullish(),
});
export type TelegramChatDataType = z.infer<typeof TelegramChatSchema>;

@Identifier("TELEGRAM_CHAT_TYPE")
@Name({ code: "en-US", content: "Telegram Chat Type" })
@DisplayMessage({ code: "en-US", content: "Chat Type: ${type}" })
@Schema(TelegramChatTypeEnum)
export class TelegramChatType {}

@Identifier("TELEGRAM_CHAT")
@Name({ code: "en-US", content: "Telegram Chat" })
@DisplayMessage({ code: "en-US", content: "Telegram Chat: ${id}" })
@Schema(TelegramChatSchema)
export class TelegramChat {}
