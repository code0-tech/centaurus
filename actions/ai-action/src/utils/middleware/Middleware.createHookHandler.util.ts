import type { SubFlow } from "@code0-tech/hercules";
import { RemoveMessage, type BaseMessage } from "@langchain/core/messages";
import type { AiMiddlewareHook } from "../../datatypes/middleware/Middleware.hook.datatype.js";
import { AiStateUpdateSchema } from "../../datatypes/middleware/Middleware.stateUpdate.datatype.js";
import { hasEntries } from "../shared/Shared.hasEntries.util.js";
import { parseOrThrow } from "../shared/Shared.parseOrThrow.util.js";
import { stripUndefined } from "../shared/Shared.stripUndefined.util.js";
import { toFlowMessage } from "../message/Message.toFlowMessage.util.js";
import { toLangChainMessage } from "../message/Message.toLangChainMessage.util.js";
import type { AgentRuntime, AgentState, HookHandler, HookResult } from "../../types/middleware/Middleware.types.js";

export function createHookHandler(run: SubFlow, agentName: string, hook: AiMiddlewareHook): HookHandler {
    return async (state: AgentState, runtime?: AgentRuntime): Promise<HookResult> => {
        // The state is stripped as a whole: `context` and `structured_response` are
        // whatever the agent put there, and a sub flow argument may not carry
        // `undefined`.
        const raw = await run(
            stripUndefined({
                messages: state.messages.map(toFlowMessage),
                agent_name: agentName,
                hook,
                ...(state.structuredResponse ? { structured_response: state.structuredResponse } : {}),
                ...(hasEntries(runtime?.context) ? { context: runtime?.context } : {}),
            }) as never,
        );
        if (raw === undefined || raw === null) return undefined;

        const update = parseOrThrow(
            AiStateUpdateSchema,
            raw,
            "ERROR_INVALID_AI_STATE_UPDATE",
            `The middleware sub flow did not return a valid state update for the ${hook} phase`,
        );
        if (!update.messages && !update.jump_to && !update.structured_response) return undefined;

        return {
            // A middleware returns the conversation it wants, not a patch of it, so
            // every message that had an id is removed before the new ones are added.
            ...(update.messages
                ? {
                      messages: [
                          ...state.messages
                              .filter((message): message is BaseMessage & { id: string } => typeof message.id === "string")
                              .map((message) => new RemoveMessage({ id: message.id })),
                          ...update.messages.map(toLangChainMessage),
                      ],
                  }
                : {}),
            ...(update.structured_response ? { structuredResponse: update.structured_response } : {}),
            ...(update.jump_to ? { jumpTo: update.jump_to } : {}),
        };
    };
}
