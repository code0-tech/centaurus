import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const AiChatUsageSchema = z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
});
export type AiChatUsage = z.infer<typeof AiChatUsageSchema>;

@Identifier("AI_CHAT_USAGE")
@Name({ code: "en-US", content: "Chat usage" })
@DisplayMessage({ code: "en-US", content: "Chat usage" })
@Schema(AiChatUsageSchema)
export class AiChatUsageDataType {}
