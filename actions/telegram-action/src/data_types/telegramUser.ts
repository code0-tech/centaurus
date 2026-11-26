import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const TelegramUserSchema = z.object({
    id: z.string(),
    isBot: z.boolean(),
    firstName: z.string(),
    lastName: z.string().nullish(),
    username: z.string().nullish(),
    languageCode: z.string().nullish(),
});
export type TelegramUserType = z.infer<typeof TelegramUserSchema>;

@Identifier("TELEGRAM_USER")
@Name({ code: "en-US", content: "Telegram User" })
@DisplayMessage({ code: "en-US", content: "Telegram User: ${firstName}" })
@Schema(TelegramUserSchema)
export class TelegramUser {}
