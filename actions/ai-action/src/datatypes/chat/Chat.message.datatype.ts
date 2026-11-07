import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiChatContentPartSchema } from "./Chat.contentPart.datatype.js";
import { AiChatRoleSchema } from "./Chat.role.datatype.js";
import { AiChatToolCallSchema } from "./Chat.toolCall.datatype.js";

export const AiChatMessageSchema = z.object({
    role: AiChatRoleSchema,
    content: z.union([z.string(), z.array(AiChatContentPartSchema)]).nullish(),
    name: z.string().optional(),
    tool_calls: z.array(AiChatToolCallSchema).optional(),
    tool_call_id: z.string().optional(),
});
export type AiChatMessage = z.infer<typeof AiChatMessageSchema>;

@Identifier("AI_CHAT_MESSAGE")
@Name({ code: "en-US", content: "Chat message" })
@DisplayMessage({ code: "en-US", content: "${role} message" })
@Schema(AiChatMessageSchema)
export class AiChatMessageDataType {}
