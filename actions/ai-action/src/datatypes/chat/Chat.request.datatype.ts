import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiChatMessageSchema } from "./Chat.message.datatype.js";

const AiChatToolSchema = z.object({
    type: z.literal("function"),
    function: z.object({
        name: z.string(),
        description: z.string().optional(),
        parameters: z.looseObject({}).optional(),
    }),
});
export type AiChatTool = z.infer<typeof AiChatToolSchema>;

export const AiChatRequestSchema = z.object({
    messages: z.array(AiChatMessageSchema),
    model: z.string().optional(),
    tools: z.array(AiChatToolSchema).optional(),
});
export type AiChatRequest = z.infer<typeof AiChatRequestSchema>;

@Identifier("AI_CHAT_REQUEST")
@Name({ code: "en-US", content: "Chat request" })
@DisplayMessage({ code: "en-US", content: "Chat request" })
@Schema(AiChatRequestSchema)
export class AiChatRequestDataType {}
