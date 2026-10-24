import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiMessageSchema } from "../../message/datatypes/Message.datatype.js";
import { AiToolChoiceSchema } from "./Model.toolChoice.datatype.js";
import { AiToolSpecSchema } from "./Model.toolSpec.datatype.js";

export const AiModelRequestSchema = z.object({
    messages: z.array(AiMessageSchema),
    tools: z.array(AiToolSpecSchema),
    stop: z.array(z.string()).optional(),
    tool_choice: AiToolChoiceSchema.optional(),
});
export type AiModelRequest = z.infer<typeof AiModelRequestSchema>;

@Identifier("AI_MODEL_REQUEST")
@Name({ code: "en-US", content: "Model request" })
@DisplayMessage({ code: "en-US", content: "Model request" })
@Schema(AiModelRequestSchema)
export class AiModelRequestDataType {}
