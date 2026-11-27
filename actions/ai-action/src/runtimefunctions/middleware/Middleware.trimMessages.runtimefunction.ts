import {
    Alias,
    Description,
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

type TrimEnd = "first" | "last";

@Identifier("ai::middleware::trim_messages")
@DisplayIcon("tabler:scissors")
@Signature(
    "(max_conversation_length: NUMBER, keep?: TEXT, keep_instructions?: BOOLEAN): TRANSFORM<AI_AGENT_STATE, AI_STATE_UPDATE>",
)
@Name({ code: "en-US", content: "Shorten long conversations" })
@Alias({ code: "en-US", content: "trim;messages;history;context;window;tokens;middleware" })
@Description({
    code: "en-US",
    content:
        "Keeps a conversation short enough for the model by dropping whole messages before the agent is asked again. Give it to an agent as a rule. Nothing is summarized - dropped messages are gone.",
})
@DisplayMessage({
    code: "en-US",
    content: "Shorten the conversation to ${max_conversation_length} tokens",
})
@ThrowsError()
@Parameter({
    runtimeName: "max_conversation_length",
    name: [{ code: "en-US", content: "Maximum conversation length" }],
    description: [
        {
            code: "en-US",
            content:
                "The length the conversation is cut down to, in tokens - one token is about three quarters of a word. The count is an estimate, so stay below what the model can really read.",
        },
    ],
})
@Parameter({
    runtimeName: "keep",
    name: [{ code: "en-US", content: "Which messages to keep" }],
    description: [
        {
            code: "en-US",
            content:
                "Which end of the conversation survives: \"newest\" keeps what was said last, \"oldest\" keeps how it began. Left empty, the newest are kept.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "keep_instructions",
    name: [{ code: "en-US", content: "Keep the instructions" }],
    description: [
        {
            code: "en-US",
            content:
                "Whether the agent's instructions are kept even when the rest is cut away. On unless switched off, because an agent that loses its instructions mid-conversation stops behaving as it was set up to.",
        },
    ],
    optional: true,
})
export class TrimMessagesMiddlewareFunction {
    run(
        _context: FunctionContext,
        max_conversation_length: number,
        keep?: string,
        keep_instructions?: boolean,
    ): AiMiddlewareTransform {
        if (
            typeof max_conversation_length !== "number" ||
            !Number.isFinite(max_conversation_length) ||
            max_conversation_length <= 0
        ) {
            throw new RuntimeError(
                "ERROR_INVALID_AI_STATE_UPDATE",
                "Shortening a conversation needs a positive length to shorten it to.",
            );
        }
        // "first" and "last" are what the trimmer itself calls the two ends; the node
        // asks for them as the ends of a conversation, which is what a person reading
        // it sees.
        if (keep !== undefined && !["newest", "oldest", "first", "last"].includes(keep)) {
            throw new RuntimeError(
                "ERROR_INVALID_AI_STATE_UPDATE",
                `"${keep}" is not an end of the conversation; keep either the "newest" or the "oldest" messages.`,
            );
        }

        const keptEnd: TrimEnd = keep === "oldest" || keep === "first" ? "first" : "last";
        const includeSystem: boolean = keep_instructions ?? true;

        return {
            name: `trim_messages:${keptEnd}:${max_conversation_length}`,
            description: `Shortens the conversation to ${max_conversation_length} tokens`,
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
                    maxTokens: max_conversation_length,
                    tokenCounter: countTokensApproximately,
                    strategy: keptEnd,
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
