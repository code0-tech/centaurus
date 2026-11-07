import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiAgentApprovalSchema } from "../agent/Agent.approval.datatype.js";
import { AiAgentStepSchema } from "../agent/Agent.step.datatype.js";
import { AiChatChoiceSchema } from "./Chat.choice.datatype.js";
import { AiChatUsageSchema } from "./Chat.usage.datatype.js";

export const AiChatResponseSchema = z.object({
    id: z.string(),
    object: z.string(),
    /**
     * The answer as plain text, so a flow can use it without walking into
     * `choices`. Not part of the OpenAI schema: the rest of this type mirrors a
     * chat completion, this field is ours. Empty when the model produced no text
     * (e.g. an answer that is only tool calls).
     */
    response: z.string(),
    /**
     * What the model thought before it answered, as plain text, present only when it
     * reported any. Not part of the OpenAI schema: `response` carries what the model
     * said, this carries what it thought, next to it rather than mixed into it.
     */
    reasoning: z.string().optional(),
    created: z.number(),
    model: z.string(),
    choices: z.array(AiChatChoiceSchema),
    usage: AiChatUsageSchema.optional(),
    /**
     * The answer in the type the node was asked to produce, present only when a type
     * was passed as `output_schema`. The signature carries that type as a generic, so
     * the flow reads this field as the very type it picked rather than as an object.
     */
    structured_response: z.looseObject({}).optional(),
    /**
     * Every tool the agent used for this answer, with its arguments and what came
     * back. Not part of the OpenAI schema - a chat completion has no field for the
     * middle of a run - but without it everything the agent did is lost on the way to
     * the client.
     */
    steps: z.array(AiAgentStepSchema).optional(),
    /**
     * Present when the answer is a question about tool calls the agent held back. The
     * answer's text asks it, so any chat client shows it; the decision comes back as
     * the next message of the conversation.
     */
    awaiting_approval: z.array(AiAgentApprovalSchema).optional(),
});
export type AiChatResponse = z.infer<typeof AiChatResponseSchema>;

@Identifier("AI_CHAT_RESPONSE")
@Name({ code: "en-US", content: "Chat response" })
@DisplayMessage({ code: "en-US", content: "Chat response" })
@Schema(AiChatResponseSchema)
export class AiChatResponseDataType {}
