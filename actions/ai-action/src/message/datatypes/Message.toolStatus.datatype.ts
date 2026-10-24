import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const AiToolStatusSchema = z.enum(["success", "error"]);
export type AiToolStatus = z.infer<typeof AiToolStatusSchema>;

@Identifier("AI_TOOL_STATUS")
@Name({ code: "en-US", content: "Tool status" })
@DisplayMessage({ code: "en-US", content: "Tool status" })
@Schema(AiToolStatusSchema)
export class AiToolStatusDataType {}
