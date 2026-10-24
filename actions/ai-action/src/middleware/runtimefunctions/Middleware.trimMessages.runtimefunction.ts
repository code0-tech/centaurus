import {
    DisplayIcon,
    DisplayMessage,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
    ThrowsError,
} from "@code0-tech/hercules";
import type { BaseMessage } from "@langchain/core/messages";
import { countTokensApproximately, trimMessages } from "langchain";
import { toFlowMessage } from "../../message/utils/Message.toFlowMessage.util.js";
import { toLangChainMessage } from "../../message/utils/Message.toLangChainMessage.util.js";
import type { AiMiddlewareTransform } from "../datatypes/Middleware.transform.datatype.js";
import type { AiStateUpdate } from "../datatypes/Middleware.stateUpdate.datatype.js";
import { AiAgentStateSchema, type AiAgentState } from "../datatypes/Middleware.agentState.datatype.js";
import { parseOrThrow } from "../../shared/utils/Shared.parseOrThrow.util.js";

type TrimStrategy = "first" | "last";

@Identifier("ai::middleware::trim_messages")
@DisplayIcon("tabler:scissors")
@Signature("(max_tokens: NUMBER, strategy?: TEXT, keep_system?: BOOLEAN): TRANSFORM<AI_AGENT_STATE, AI_STATE_UPDATE>")
@Name({ code: "en-US", content: "Trim messages" })
@DisplayMessage({
    code: "en-US",
    content: "Trim the conversation to ${max_tokens} tokens",
})
@ThrowsError()
@Parameter({
    runtimeName: "max_tokens",
    name: [{ code: "en-US", content: "Maximum tokens" }],
})
@Parameter({
    runtimeName: "strategy",
    name: [{ code: "en-US", content: "Strategy" }],
    optional: true,
})
@Parameter({
    runtimeName: "keep_system",
    name: [{ code: "en-US", content: "Keep system prompt" }],
    optional: true,
})
export class TrimMessagesMiddlewareFunction {
    run(
        _context: FunctionContext,
        max_tokens: number,
        strategy?: string,
        keep_system?: boolean,
    ): AiMiddlewareTransform {
        if (typeof max_tokens !== "number" || !Number.isFinite(max_tokens) || max_tokens <= 0) {
            throw new RuntimeError("ERROR_INVALID_AI_STATE_UPDATE", "Trimming needs a positive token budget.");
        }
        if (strategy !== undefined && strategy !== "first" && strategy !== "last") {
            throw new RuntimeError(
                "ERROR_INVALID_AI_STATE_UPDATE",
                `"${strategy}" is not a trim strategy; use "first" or "last".`,
            );
        }

        const trimStrategy: TrimStrategy = strategy === "first" ? "first" : "last";
        const includeSystem: boolean = keep_system ?? true;

        return async (state: AiAgentState): Promise<AiStateUpdate> => {
            const parsed: AiAgentState = parseOrThrow(
                AiAgentStateSchema,
                state,
                "ERROR_INVALID_AI_AGENT_STATE",
                "The agent state is not valid",
            );

            const trimmed: BaseMessage[] = await trimMessages(parsed.messages.map(toLangChainMessage), {
                maxTokens: max_tokens,
                tokenCounter: countTokensApproximately,
                strategy: trimStrategy,
                includeSystem,
                allowPartial: false,
                startOn: "human",
            });

            if (trimmed.length === parsed.messages.length) return {};

            return { messages: trimmed.map(toFlowMessage) };
        };
    }
}
