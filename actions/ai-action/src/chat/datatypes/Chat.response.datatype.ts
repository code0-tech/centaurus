import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiChatChoiceSchema } from "./Chat.choice.datatype.js";
import { AiChatUsageSchema } from "./Chat.usage.datatype.js";

export const AiChatResponseSchema = z.object({
    id: z.string(),
    object: z.string(),
    created: z.number(),
    model: z.string(),
    choices: z.array(AiChatChoiceSchema),
    usage: AiChatUsageSchema.optional(),
});
export type AiChatResponse = z.infer<typeof AiChatResponseSchema>;

@Identifier("AI_CHAT_RESPONSE")
@Name({ code: "en-US", content: "Chat response" })
@DisplayMessage({ code: "en-US", content: "Chat response" })
@Schema(AiChatResponseSchema)
export class AiChatResponseDataType {}
