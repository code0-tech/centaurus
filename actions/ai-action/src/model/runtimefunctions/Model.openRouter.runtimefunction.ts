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
import type { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import type { AIMessage, AIMessageChunk, BaseMessage } from "@langchain/core/messages";
import type { Runnable } from "@langchain/core/runnables";
import { ChatOpenAI, type ChatOpenAICallOptions } from "@langchain/openai";
import { toFlowMessage } from "../../message/utils/Message.toFlowMessage.util.js";
import { toLangChainMessage } from "../../message/utils/Message.toLangChainMessage.util.js";
import type { AiModelResponse } from "../datatypes/Model.response.datatype.js";
import type { AiModelTransform } from "../datatypes/Model.transform.datatype.js";
import { AiModelRequestSchema, type AiModelRequest } from "../datatypes/Model.request.datatype.js";
import { describeError } from "../../shared/utils/Shared.describeError.util.js";
import { parseOrThrow } from "../../shared/utils/Shared.parseOrThrow.util.js";
import { requireText } from "../../shared/utils/Shared.requireText.util.js";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface ToolDefinition {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}

type BoundModel = Runnable<BaseLanguageModelInput, AIMessageChunk, ChatOpenAICallOptions>;

@Identifier("ai::model::openrouter")
@DisplayIcon("tabler:router")
@Signature(
    "(model: TEXT, api_key: TEXT, temperature?: NUMBER, max_tokens?: NUMBER): TRANSFORM<AI_MODEL_REQUEST, AI_MODEL_RESPONSE>",
)
@Name({ code: "en-US", content: "OpenRouter model" })
@DisplayMessage({ code: "en-US", content: "OpenRouter ${model}" })
@ThrowsError()
@Parameter({
    runtimeName: "model",
    name: [{ code: "en-US", content: "Model" }],
})
@Parameter({
    runtimeName: "api_key",
    name: [{ code: "en-US", content: "API key" }],
})
@Parameter({
    runtimeName: "temperature",
    name: [{ code: "en-US", content: "Temperature" }],
    optional: true,
})
@Parameter({
    runtimeName: "max_tokens",
    name: [{ code: "en-US", content: "Maximum tokens" }],
    optional: true,
})
export class OpenRouterModelFunction {
    run(
        _context: FunctionContext,
        model: string,
        api_key: string,
        temperature?: number,
        max_tokens?: number,
    ): AiModelTransform {
        const identifier: string = requireText(
            model,
            "ERROR_INVALID_AI_MODEL",
            "An OpenRouter model needs a model identifier.",
        );
        const chat: ChatOpenAI = new ChatOpenAI({
            model: identifier,
            apiKey: requireText(api_key, "ERROR_INVALID_AI_MODEL", "An OpenRouter model needs an API key."),
            configuration: { baseURL: OPENROUTER_BASE_URL },
            temperature,
            maxTokens: max_tokens,
        });

        return async (request: AiModelRequest): Promise<AiModelResponse> => {
            const parsed: AiModelRequest = parseOrThrow(
                AiModelRequestSchema,
                request,
                "ERROR_INVALID_AI_MODEL_REQUEST",
                "The model request is not valid",
            );

            const tools: ToolDefinition[] = parsed.tools.map((tool) => ({
                type: "function",
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.input_schema,
                },
            }));
            const bound: BoundModel = tools.length > 0 ? chat.bindTools(tools) : chat;
            const messages: BaseMessage[] = parsed.messages.map(toLangChainMessage);

            const answer: AIMessage = await bound
                .invoke(messages, {
                    ...(parsed.stop ? { stop: parsed.stop } : {}),
                    ...(parsed.tool_choice ? { tool_choice: parsed.tool_choice } : {}),
                })
                .catch((error: unknown) => {
                    throw new RuntimeError(
                        "ERROR_AI_MODEL_CALL_FAILED",
                        `The OpenRouter call to "${identifier}" failed: ${describeError(error)}`,
                    );
                });

            return { message: toFlowMessage(answer) };
        };
    }
}
