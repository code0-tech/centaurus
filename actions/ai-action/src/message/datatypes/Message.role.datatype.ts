import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const AiMessageRoleSchema = z.enum(["system", "human", "ai", "tool"]);
export type AiMessageRole = z.infer<typeof AiMessageRoleSchema>;

@Identifier("AI_MESSAGE_ROLE")
@Name({ code: "en-US", content: "Message role" })
@DisplayMessage({ code: "en-US", content: "Message role" })
@Schema(AiMessageRoleSchema)
export class AiMessageRoleDataType {}
