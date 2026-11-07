import type { BaseMessage } from "@langchain/core/messages";

export interface AgentState {
    messages: BaseMessage[];
    structuredResponse?: Record<string, unknown>;
}

export interface AgentRuntime {
    context?: Record<string, unknown>;
}

/** What a hook may answer with: a state update, or nothing to change. */
export type HookResult = Record<string, unknown> | undefined;

/** A middleware hook as the agent calls it, for one phase of one agent. */
export type HookHandler = (state: AgentState, runtime?: AgentRuntime) => Promise<HookResult>;
