import type { AiAgentResponse } from "../datatypes/Agent.response.datatype.js";
import { AiAgentRequestSchema, type AiAgentRequest } from "../datatypes/Agent.request.datatype.js";
import { compileAgent, type AgentDefinition, type CompiledAgent } from "./Agent.compileAgent.util.js";
import { parseOrThrow } from "../../shared/utils/Shared.parseOrThrow.util.js";
import { toFlowMessage } from "../../message/utils/Message.toFlowMessage.util.js";
import { toLangChainMessage } from "../../message/utils/Message.toLangChainMessage.util.js";

export async function runAgent(definition: AgentDefinition, request: AiAgentRequest): Promise<AiAgentResponse> {
    const parsed: AiAgentRequest = parseOrThrow(
        AiAgentRequestSchema,
        request,
        "ERROR_INVALID_AI_AGENT_REQUEST",
        "The agent request is not valid",
    );
    const compiled: CompiledAgent = await compileAgent(definition);

    try {
        const result = await compiled.agent.invoke(
            { messages: parsed.messages.map(toLangChainMessage) },
            parsed.thread_id ? { configurable: { thread_id: parsed.thread_id } } : undefined,
        );

        return {
            messages: result.messages.map(toFlowMessage),
            ...(result.structuredResponse ? { structured_response: result.structuredResponse } : {}),
        };
    } finally {
        await compiled.close().catch(() => undefined);
    }
}
