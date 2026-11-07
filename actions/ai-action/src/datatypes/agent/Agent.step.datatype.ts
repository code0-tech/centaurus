import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * One tool the agent used while it worked on an answer.
 *
 * A chat completion only carries the last message, so everything the agent did on the
 * way - which tools it called, with what, and what came back - would be lost by the
 * time the answer reaches a client. These steps carry it: a flow can log them, and a
 * client that knows the field can show what happened instead of just the result.
 */
export const AiAgentStepSchema = z.object({
    name: z.string(),
    args: z.looseObject({}).optional(),
    /** What the tool answered, as text - a tool may return anything. */
    result: z.string().optional(),
    /** Set when the call failed, instead of a result. */
    error: z.string().optional(),
});
export type AiAgentStep = z.infer<typeof AiAgentStepSchema>;

@Identifier("AI_AGENT_STEP")
@Name({ code: "en-US", content: "Agent step" })
@DisplayMessage({ code: "en-US", content: "${name}" })
@Schema(AiAgentStepSchema)
export class AiAgentStepDataType {}
