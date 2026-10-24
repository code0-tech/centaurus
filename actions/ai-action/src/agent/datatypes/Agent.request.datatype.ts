import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiMessageSchema } from "../../message/datatypes/Message.datatype.js";

export const AiAgentRequestSchema = z.object({
    messages: z.array(AiMessageSchema),
    thread_id: z.string().optional(),
});
export type AiAgentRequest = z.infer<typeof AiAgentRequestSchema>;

@Identifier("AI_AGENT_REQUEST")
@Name({ code: "en-US", content: "Agent request" })
@DisplayMessage({ code: "en-US", content: "Agent request" })
@Schema(AiAgentRequestSchema)
export class AiAgentRequestDataType {}
