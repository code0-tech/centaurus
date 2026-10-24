import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiMessageSchema } from "../../message/datatypes/Message.datatype.js";

export const AiModelResponseSchema = z.object({
    message: AiMessageSchema,
});
export type AiModelResponse = z.infer<typeof AiModelResponseSchema>;

@Identifier("AI_MODEL_RESPONSE")
@Name({ code: "en-US", content: "Model response" })
@DisplayMessage({ code: "en-US", content: "Model response" })
@Schema(AiModelResponseSchema)
export class AiModelResponseDataType {}
