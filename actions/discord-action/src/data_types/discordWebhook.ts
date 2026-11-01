import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const DiscordWebhookResponseDataSchema = z.object({
    success: z.boolean(),
    statusCode: z.number(),
    message: z.string(),
});
export type DiscordWebhookResponseData = z.infer<typeof DiscordWebhookResponseDataSchema>;

@Identifier("DISCORD_WEBHOOK_RESPONSE")
@Name({ code: "en-US", content: "Discord Webhook Response" })
@DisplayMessage({ code: "en-US", content: "Discord Webhook Response status: ${statusCode}" })
@Schema(DiscordWebhookResponseDataSchema)
export class DiscordWebhookResponseDataType {}
