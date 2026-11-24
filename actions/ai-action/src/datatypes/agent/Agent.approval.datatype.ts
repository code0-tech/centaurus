import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * A tool call the agent asked about instead of running.
 *
 * It is what a person needs to judge the call - which tool, with which arguments -
 * and it is in the answer so a flow can act on it without reading the text. The
 * decision itself comes back as the next message of the conversation: a chat client
 * has no other channel, and the model reads the reply in context.
 */
export const AiAgentApprovalSchema = z.object({
    name: z.string(),
    args: z.looseObject({}).optional(),
    /**
     * The code this call is approved or declined with. Only "APPROVE <code>" of this
     * very question lets it run, so a flow building buttons elsewhere has to send
     * exactly that back as the next message.
     */
    code: z.string().optional(),
});
export type AiAgentApproval = z.infer<typeof AiAgentApprovalSchema>;

@Identifier("AI_AGENT_APPROVAL")
@Name({ code: "en-US", content: "Approval request" })
@DisplayMessage({ code: "en-US", content: "${name}" })
@Schema(AiAgentApprovalSchema)
export class AiAgentApprovalDataType {}
