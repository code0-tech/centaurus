import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiChatMessageSchema } from "./Chat.message.datatype.js";

export const AiChatRequestSchema = z.object({
    messages: z.array(AiChatMessageSchema),
    model: z.string().optional(),
});
export type AiChatRequest = z.infer<typeof AiChatRequestSchema>;

@Identifier("AI_CHAT_REQUEST")
@Name({ code: "en-US", content: "Chat request" })
@DisplayMessage({ code: "en-US", content: "Chat request" })
@Schema(AiChatRequestSchema)
export class AiChatRequestDataType {}
