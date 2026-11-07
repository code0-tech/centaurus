import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const AiChatContentPartSchema = z.looseObject({ type: z.string() });
export type AiChatContentPart = z.infer<typeof AiChatContentPartSchema>;

@Identifier("AI_CHAT_CONTENT_PART")
@Name({ code: "en-US", content: "Chat content part" })
@DisplayMessage({ code: "en-US", content: "${type} part" })
@Schema(AiChatContentPartSchema)
export class AiChatContentPartDataType {}
