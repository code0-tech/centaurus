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
import { toFlowMessage } from "../../utils/message/Message.toFlowMessage.util.js";
import { toLangChainMessage } from "../../utils/message/Message.toLangChainMessage.util.js";
import { AiModelResponseSchema, type AiModelResponse } from "../../datatypes/model/Model.response.datatype.js";
import type { AiModelTransform } from "../../datatypes/model/Model.transform.datatype.js";
import { AiModelRequestSchema, type AiModelRequest } from "../../datatypes/model/Model.request.datatype.js";
import { describeError } from "../../utils/shared/Shared.describeError.util.js";
import { logger } from "../../utils/shared/Log.logger.util.js";
import { parseOrThrow } from "../../utils/shared/Shared.parseOrThrow.util.js";
import { requireText } from "../../utils/shared/Shared.requireText.util.js";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const log = logger("model:openrouter");

/**
 * OpenRouter's own web search, as a server tool: the provider runs the search and
 * hands the model the excerpts, so the flow needs no search tool and no key of its
 * own. It replaces the deprecated "web" plugin and the ":online" model suffix, and
 * unlike those it leaves the model to decide whether a search is needed at all.
 */
const WEB_SEARCH_TOOL = { type: "openrouter:web_search" } as const;

/**
 * Route a request only to a provider that supports every parameter it carries.
 *
 * OpenRouter serves one model from many provider endpoints, and they do not support
 * the same parameters: of the 26 endpoints behind "openai/gpt-oss-120b", some take
 * no tools at all, some take tools but no "response_format", some the reverse. The
 * model's own parameter list is the union over all of them, so a parameter the model
 * supports still reaches an endpoint that does not - and then the request is either
 * rejected outright or, worse, the provider gives up mid-generation and OpenRouter
 * answers 200 with whatever text it had, as if the parameter had simply been
 * ignored. This is filtered against the parameters actually sent, so a request that
 * asks for nothing special keeps every endpoint it had.
 */
const REQUIRE_SUPPORTED_PARAMETERS = { provider: { require_parameters: true } } as const;

/**
 * What OpenRouter actually objected to.
 *
 * The OpenAI client turns a rejection into "400 Provider returned error" and leaves
 * the reason in the body: OpenRouter puts the upstream provider's own message under
 * `error.metadata`, and that is the only part that says which parameter was refused.
 * Without it a model that cannot do what was asked of it is indistinguishable from a
 * wrong key.
 */
function describeProviderError(error: unknown): string {
    const described: string = describeError(error);
    const body = (error as { error?: { message?: unknown; metadata?: unknown } } | undefined)?.error;
    if (!body || typeof body !== "object") return described;

    const details: string[] = [];
    if (typeof body.message === "string" && !described.includes(body.message)) details.push(body.message);
    if (body.metadata !== undefined) details.push(JSON.stringify(body.metadata));

    return details.length > 0 ? `${described} (${details.join(": ")})` : described;
}

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
@DisplayIcon("simple:openrouter")
@Signature(
    "(model: TEXT, api_key: TEXT, temperature?: NUMBER, max_tokens?: NUMBER, web_search?: BOOLEAN, structured_output?: BOOLEAN): TRANSFORM<AI_MODEL_REQUEST, AI_MODEL_RESPONSE>",
)
@Name({ code: "en-US", content: "OpenRouter model" })
@DisplayMessage({ code: "en-US", content: "OpenRouter ${model}" })
@ThrowsError()
@Parameter({
    runtimeName: "model",
    name: [{ code: "en-US", content: "Model" }],
    description: [
        {
            code: "en-US",
            content:
                "The OpenRouter model identifier, written as provider and model, for example \"anthropic/claude-sonnet-4.5\". It decides which model OpenRouter routes the request to.",
        },
    ],
})
@Parameter({
    runtimeName: "api_key",
    name: [{ code: "en-US", content: "API key" }],
    description: [
        {
            code: "en-US",
            content:
                "The OpenRouter API key the requests are sent with. It is what the usage is billed against, so it belongs in a secret rather than in the node.",
        },
    ],
})
@Parameter({
    runtimeName: "temperature",
    name: [{ code: "en-US", content: "Temperature" }],
    description: [
        {
            code: "en-US",
            content:
                "How much the model is allowed to vary its answers: low values keep them focused and repeatable, higher ones make them more varied. Left empty, the model's own default applies.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "max_tokens",
    name: [{ code: "en-US", content: "Maximum tokens" }],
    description: [
        {
            code: "en-US",
            content:
                "The ceiling on how long a single answer may get, counted in tokens. An answer that reaches it is cut off mid-sentence, so leave it empty unless the length has to be bounded.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "structured_output",
    name: [{ code: "en-US", content: "Structured output" }],
    description: [
        {
            code: "en-US",
            content:
                "Lets the agent ask this model for an output type directly, so the provider constrains the answer and the model cannot write anything else. On unless switched off. Switched off, an output type is asked for as a forced tool call instead - which a model is free to ignore, and which some models break on outright, so turn it off only for a model that cannot constrain its own output.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "web_search",
    name: [{ code: "en-US", content: "Web search" }],
    description: [
        {
            code: "en-US",
            content:
                "Lets the model search the web through OpenRouter, which runs the search and hands the model the excerpts - so the flow needs no search tool and no key of its own. Off unless switched on; the model still decides for itself whether a search is needed.",
        },
    ],
    optional: true,
})
export class OpenRouterModelFunction {
    /**
     * "web_search" is off unless the node switches it on. It sits on the model rather
     * than on the agent because only the model knows its provider: the agent holds
     * its model as a transform and could do nothing with the switch but pass it on.
     */
    run(
        _context: FunctionContext,
        model: string,
        api_key: string,
        temperature?: number,
        max_tokens?: number,
        web_search?: boolean,
        structured_output?: boolean,
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
            modelKwargs: { ...REQUIRE_SUPPORTED_PARAMETERS },
        });

        // What the agent reads to decide how to get a structured answer: carrying
        // "response_format" is this node saying it can constrain its own output, and
        // dropping it sends the agent down the tool call instead. The switch has to
        // reach the agent as a schema, because a sub flow carries nothing else.
        const requestSchema =
            structured_output === false ? AiModelRequestSchema.omit({ response_format: true }) : AiModelRequestSchema;

        return {
            name: `openrouter:${identifier}`,
            description: `OpenRouter model ${identifier}`,
            inputSchema: requestSchema,
            outputSchema: AiModelResponseSchema,
            run: async (request: AiModelRequest): Promise<AiModelResponse> => {
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
                const bindable: (ToolDefinition | typeof WEB_SEARCH_TOOL)[] = [
                    ...tools,
                    ...(web_search === true ? [WEB_SEARCH_TOOL] : []),
                ];
                const bound: BoundModel = bindable.length > 0 ? chat.bindTools(bindable as never) : chat;
                const messages: BaseMessage[] = parsed.messages.map(toLangChainMessage);

                // The type the answer has to come back in, in the OpenAI dialect.
                // OpenRouter constrains the generation itself, so the model cannot
                // answer anything but matching JSON and the agent needs no tool call
                // to get a structured answer out of it - but only the model and the
                // provider it is routed to decide whether that is possible at all,
                // and one that cannot do it rejects the whole call. Hence the switch:
                // the field is only read when the node was told this model can serve
                // it. "strict" is forwarded as asked for, which means OpenAI requires
                // every nested object to close itself with "additionalProperties":
                // false rather than answering loosely.
                const responseFormat = structured_output === false ? undefined : parsed.response_format;

                // What a model answered is only half of a failed run: whether it was
                // asked to call a tool at all, and whether it then did, is the other
                // half, and only this node sees both.
                log.debug(`calling "${identifier}" with`, {
                    messages: parsed.messages.length,
                    tools: bindable.length,
                    tool_choice: parsed.tool_choice,
                    response_format: responseFormat?.name,
                });

                const answer: AIMessage = await bound
                    .invoke(messages, {
                        ...(parsed.stop ? { stop: parsed.stop } : {}),
                        ...(parsed.tool_choice ? { tool_choice: parsed.tool_choice } : {}),
                        ...(responseFormat
                            ? {
                                  response_format: {
                                      type: "json_schema",
                                      json_schema: {
                                          name: responseFormat.name,
                                          schema: responseFormat.schema,
                                          ...(responseFormat.description
                                              ? { description: responseFormat.description }
                                              : {}),
                                          ...(responseFormat.strict !== undefined
                                              ? { strict: responseFormat.strict }
                                              : {}),
                                      },
                                  },
                              }
                            : {}),
                    })
                    .catch((error: unknown) => {
                        // Which parameter a provider refused is only answerable
                        // against what was actually sent, and a rejected call is
                        // exactly when nobody can reconstruct that from the flow.
                        log.error(`the call to "${identifier}" was rejected, having sent`, {
                            tools: bindable,
                            tool_choice: parsed.tool_choice,
                            response_format: responseFormat,
                        });
                        throw new RuntimeError(
                            "ERROR_AI_MODEL_CALL_FAILED",
                            `The OpenRouter call to "${identifier}" failed: ${describeProviderError(error)}`,
                        );
                    });

                const reply = toFlowMessage(answer);
                const metadata = answer.response_metadata as { finish_reason?: unknown } | undefined;
                log.debug(`"${identifier}" answered with`, {
                    blocks: (reply.content ?? []).map((block) => block.type),
                    tool_calls: (reply.content ?? [])
                        .filter((block) => block.type === "tool_call")
                        .map((block) => block.name),
                    finish_reason: (answer.response_metadata as { finish_reason?: unknown })?.finish_reason,
                });

                // A provider that gave up mid-generation still answers 200 through
                // OpenRouter, with whatever text it had produced and "error" as the
                // finish reason. Taken at face value that is a valid answer, and the
                // run fails later and elsewhere - the agent gets blamed for not
                // answering in the type it was asked for, when in truth it was never
                // asked. The finish reason is the only place this is visible, so it
                // is read here, where the provider's own vocabulary still applies.
                if (metadata?.finish_reason === "error") {
                    throw new RuntimeError(
                        "ERROR_AI_MODEL_CALL_FAILED",
                        `The OpenRouter call to "${identifier}" was cut short: the provider gave up mid-generation and reported "error" as the finish reason. This is what a model that cannot serve a parameter it was given does, so the usual cause is a request it does not support - a forced tool call above all, which is how an output type is asked for from a model that cannot constrain its own output.`,
                    );
                }

                return { message: reply };
            },
        };
    }
}
