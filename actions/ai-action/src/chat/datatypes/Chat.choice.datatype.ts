import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiChatMessageSchema } from "./Chat.message.datatype.js";

export const AiChatChoiceSchema = z.object({
    index: z.number(),
    message: AiChatMessageSchema,
    finish_reason: z.string(),
});
export type AiChatChoice = z.infer<typeof AiChatChoiceSchema>;

@Identifier("AI_CHAT_CHOICE")
@Name({ code: "en-US", content: "Chat choice" })
@DisplayMessage({ code: "en-US", content: "Chat choice" })
@Schema(AiChatChoiceSchema)
export class AiChatChoiceDataType {}
