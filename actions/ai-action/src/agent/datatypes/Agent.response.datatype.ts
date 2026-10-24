import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiMessageSchema } from "../../message/datatypes/Message.datatype.js";

export const AiAgentResponseSchema = z.object({
    messages: z.array(AiMessageSchema),
    structured_response: z.looseObject({}).optional(),
});
export type AiAgentResponse = z.infer<typeof AiAgentResponseSchema>;

@Identifier("AI_AGENT_RESPONSE")
@Name({ code: "en-US", content: "Agent response" })
@DisplayMessage({ code: "en-US", content: "Agent response" })
@Schema(AiAgentResponseSchema)
export class AiAgentResponseDataType {}
