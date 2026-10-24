import type { SubFlow } from "@code0-tech/hercules";
import type { AiMiddlewareHook } from "../datatypes/Middleware.hook.datatype.js";
import { AiStateUpdateSchema } from "../datatypes/Middleware.stateUpdate.datatype.js";
import { parseOrThrow } from "../../shared/utils/Shared.parseOrThrow.util.js";
import { replaceMessages } from "../../message/utils/Message.replaceMessages.util.js";
import { toFlowState, type AgentRuntime, type AgentState } from "./Middleware.toFlowState.util.js";

type HookResult = Record<string, unknown> | undefined;

export type HookHandler = (state: AgentState, runtime?: AgentRuntime) => Promise<HookResult>;

export function createHookHandler(run: SubFlow, agentName: string, hook: AiMiddlewareHook): HookHandler {
    return async (state: AgentState, runtime?: AgentRuntime): Promise<HookResult> => {
        const raw = await run(toFlowState(state, runtime, agentName, hook) as never);
        if (raw === undefined || raw === null) return undefined;

        const update = parseOrThrow(
            AiStateUpdateSchema,
            raw,
            "ERROR_INVALID_AI_STATE_UPDATE",
            `The middleware sub flow did not return a valid state update for the ${hook} phase`,
        );
        if (!update.messages && !update.jump_to && !update.structured_response) return undefined;

        return {
            ...(update.messages ? { messages: replaceMessages(state.messages, update.messages) } : {}),
            ...(update.structured_response ? { structuredResponse: update.structured_response } : {}),
            ...(update.jump_to ? { jumpTo: update.jump_to } : {}),
        };
    };
}
