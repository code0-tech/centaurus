import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const AiChatRoleSchema = z.enum(["system", "user", "assistant", "tool"]);
export type AiChatRole = z.infer<typeof AiChatRoleSchema>;

@Identifier("AI_CHAT_ROLE")
@Name({ code: "en-US", content: "Chat role" })
@DisplayMessage({ code: "en-US", content: "Chat role" })
@Schema(AiChatRoleSchema)
export class AiChatRoleDataType {}
