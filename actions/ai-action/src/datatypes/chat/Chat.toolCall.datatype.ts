import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const AiChatToolCallSchema = z.object({
    id: z.string(),
    type: z.literal("function"),
    function: z.object({
        name: z.string(),
        arguments: z.string(),
    }),
});
export type AiChatToolCall = z.infer<typeof AiChatToolCallSchema>;

@Identifier("AI_CHAT_TOOL_CALL")
@Name({ code: "en-US", content: "Chat tool call" })
@DisplayMessage({ code: "en-US", content: "Chat tool call" })
@Schema(AiChatToolCallSchema)
export class AiChatToolCallDataType {}
