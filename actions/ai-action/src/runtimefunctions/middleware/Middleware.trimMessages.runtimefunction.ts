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
import { toFlowMessage } from "../../utils/message/Message.toFlowMessage.util.js";
import { toLangChainMessage } from "../../utils/message/Message.toLangChainMessage.util.js";
import type { AiMiddlewareTransform } from "../../datatypes/middleware/Middleware.transform.datatype.js";
import { AiStateUpdateSchema, type AiStateUpdate } from "../../datatypes/middleware/Middleware.stateUpdate.datatype.js";
import { AiAgentStateSchema, type AiAgentState } from "../../datatypes/middleware/Middleware.agentState.datatype.js";
import { parseOrThrow } from "../../utils/shared/Shared.parseOrThrow.util.js";

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
    description: [
        {
            code: "en-US",
            content:
                "The size the conversation is cut down to before it is sent to the model, counted in tokens and approximated rather than counted by the model's own tokenizer. It has to be a positive number.",
        },
    ],
})
@Parameter({
    runtimeName: "strategy",
    name: [{ code: "en-US", content: "Strategy" }],
    description: [
        {
            code: "en-US",
            content:
                "Which end of the conversation survives the cut: \"last\" keeps the most recent messages, \"first\" keeps the oldest ones. Defaults to \"last\", which is what keeps an ongoing conversation usable.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "keep_system",
    name: [{ code: "en-US", content: "Keep system prompt" }],
    description: [
        {
            code: "en-US",
            content:
                "Whether the system prompt is kept even when the rest is cut away. On by default, because an agent that loses its instructions mid-conversation stops behaving as it was set up to.",
        },
    ],
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

        return {
            name: `trim_messages:${trimStrategy}:${max_tokens}`,
            description: `Trims the conversation to ${max_tokens} tokens`,
            inputSchema: AiAgentStateSchema,
            outputSchema: AiStateUpdateSchema,
            run: async (state: AiAgentState): Promise<AiStateUpdate> => {
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
            },
        };
    }
}
