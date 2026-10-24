import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiMessageSchema } from "../../message/datatypes/Message.datatype.js";
import { AiMiddlewareHookSchema } from "./Middleware.hook.datatype.js";

export const AiAgentStateSchema = z.object({
    messages: z.array(AiMessageSchema),
    agent_name: z.string(),
    hook: AiMiddlewareHookSchema,
    structured_response: z.looseObject({}).optional(),
    context: z.looseObject({}).optional(),
    thread_id: z.string().optional(),
});
export type AiAgentState = z.infer<typeof AiAgentStateSchema>;

@Identifier("AI_AGENT_STATE")
@Name({ code: "en-US", content: "AiAgent state" })
@DisplayMessage({ code: "en-US", content: "State of ${agent_name} at ${hook}" })
@Schema(AiAgentStateSchema)
export class AiAgentStateDataType {}
