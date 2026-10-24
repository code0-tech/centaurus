import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiMessageSchema } from "../../message/datatypes/Message.datatype.js";

export const AiStateUpdateSchema = z.object({
    messages: z.array(AiMessageSchema).optional(),
    jump_to: z.enum(["end", "model", "tools"]).optional(),
    structured_response: z.looseObject({}).optional(),
});
export type AiStateUpdate = z.infer<typeof AiStateUpdateSchema>;

@Identifier("AI_STATE_UPDATE")
@Name({ code: "en-US", content: "State update" })
@DisplayMessage({ code: "en-US", content: "State update" })
@Schema(AiStateUpdateSchema)
export class AiStateUpdateDataType {}
