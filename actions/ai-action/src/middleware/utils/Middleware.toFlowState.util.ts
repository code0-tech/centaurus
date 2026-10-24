import type { BaseMessage } from "@langchain/core/messages";
import type { AiAgentState } from "../datatypes/Middleware.agentState.datatype.js";
import type { AiMiddlewareHook } from "../datatypes/Middleware.hook.datatype.js";
import { hasEntries } from "../../shared/utils/Shared.hasEntries.util.js";
import { toFlowMessage } from "../../message/utils/Message.toFlowMessage.util.js";

export interface AgentState {
    messages: BaseMessage[];
    structuredResponse?: Record<string, unknown>;
}

export interface AgentRuntime {
    context?: Record<string, unknown>;
    configurable?: { thread_id?: string; [key: string]: unknown };
}

export function toFlowState(
    state: AgentState,
    runtime: AgentRuntime | undefined,
    agentName: string,
    hook: AiMiddlewareHook,
): AiAgentState {
    return {
        messages: state.messages.map(toFlowMessage),
        agent_name: agentName,
        hook,
        ...(state.structuredResponse ? { structured_response: state.structuredResponse } : {}),
        ...(hasEntries(runtime?.context) ? { context: runtime?.context } : {}),
        ...(typeof runtime?.configurable?.thread_id === "string" ? { thread_id: runtime.configurable.thread_id } : {}),
    };
}
