import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiAgentApprovalSchema } from "./Agent.approval.datatype.js";
import { AiAgentStepSchema } from "./Agent.step.datatype.js";
import { AiMessageSchema } from "../message/Message.datatype.js";

export const AiAgentResponseSchema = z.object({
    messages: z.array(AiMessageSchema),
    structured_response: z.looseObject({}).optional(),
    /** Every tool the agent used, in the order it used them. */
    steps: z.array(AiAgentStepSchema).optional(),
    /** The calls the agent asked about instead of running them. */
    awaiting_approval: z.array(AiAgentApprovalSchema).optional(),
});
export type AiAgentResponse = z.infer<typeof AiAgentResponseSchema>;

@Identifier("AI_AGENT_RESPONSE")
@Name({ code: "en-US", content: "Agent response" })
@DisplayMessage({ code: "en-US", content: "Agent response" })
@Schema(AiAgentResponseSchema)
export class AiAgentResponseDataType {}
