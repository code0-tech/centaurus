import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiMessageSchema } from "../message/Message.datatype.js";
import { AiResponseFormatSchema } from "./Model.responseFormat.datatype.js";
import { AiToolChoiceSchema } from "./Model.toolChoice.datatype.js";
import { AiToolSpecSchema } from "./Model.toolSpec.datatype.js";

export const AiModelRequestSchema = z.object({
    messages: z.array(AiMessageSchema),
    tools: z.array(AiToolSpecSchema),
    stop: z.array(z.string()).optional(),
    tool_choice: AiToolChoiceSchema.optional(),
    // Carrying this field is how a model node declares that it can constrain its
    // own output: the agent reads the declared request schema of the model it was
    // handed, and only asks for a native structured answer when the field is there.
    response_format: AiResponseFormatSchema.optional(),
});
export type AiModelRequest = z.infer<typeof AiModelRequestSchema>;

@Identifier("AI_MODEL_REQUEST")
@Name({ code: "en-US", content: "Model request" })
@DisplayMessage({ code: "en-US", content: "Model request" })
@Schema(AiModelRequestSchema)
export class AiModelRequestDataType {}
