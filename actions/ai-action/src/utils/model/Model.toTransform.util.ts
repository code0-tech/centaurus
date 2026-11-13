import { RuntimeError } from "@code0-tech/hercules";
import type { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import type { BaseChatModel, BaseChatModelCallOptions } from "@langchain/core/language_models/chat_models";
import type { AIMessage, AIMessageChunk, BaseMessage } from "@langchain/core/messages";
import type { Runnable } from "@langchain/core/runnables";
import { AiModelRequestSchema, type AiModelRequest } from "../../datatypes/model/Model.request.datatype.js";
import { AiModelResponseSchema, type AiModelResponse } from "../../datatypes/model/Model.response.datatype.js";
import type { AiResponseFormat } from "../../datatypes/model/Model.responseFormat.datatype.js";
import type { AiModelTransform } from "../../datatypes/model/Model.transform.datatype.js";
import { toFlowMessage } from "../message/Message.toFlowMessage.util.js";
import { toLangChainMessage } from "../message/Message.toLangChainMessage.util.js";
import { describeError } from "../shared/Shared.describeError.util.js";
import { logger } from "../shared/Log.logger.util.js";
import { parseOrThrow } from "../shared/Shared.parseOrThrow.util.js";

/** A tool as every OpenAI-dialect provider wants to be handed it. */
interface ToolDefinition {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}

/** A provider client, narrowed to what a model call needs of it. */
type AnyChatModel = BaseChatModel<BaseChatModelCallOptions> & {
    bindTools: (tools: never) => BoundModel;
};
type BoundModel = Runnable<BaseLanguageModelInput, AIMessageChunk, BaseChatModelCallOptions>;

/**
 * What every model node has in common, and what only it can answer.
 *
 * The flow side of a model is the same everywhere: a request of messages, tools, a
 * tool choice and possibly an output type goes in, one message comes back. What a
 * provider differs in is narrow enough to name - the dialect its output type is
 * written in, the tools it runs itself, what its rejections look like - so that is
 * what a node passes in, and the rest lives here rather than once per provider.
 */
export interface ModelTransformOptions {
    /** The provider as the flow reads it in a message, e.g. "OpenRouter". */
    provider: string;
    /** What this provider's log channel is named, e.g. "openrouter". */
    prefix: string;
    /** The model identifier the node was given. */
    identifier: string;
    /** The provider client, already configured by the node. */
    model: AnyChatModel;
    /**
     * The output type in this provider's own dialect, as call options - OpenAI's
     * `response_format`, Anthropic's `outputConfig`, Ollama's `format`. Left out,
     * the node declares that it cannot constrain its own output at all, and the
     * agent asks for an output type as a forced tool call instead.
     */
    responseFormat?: (format: AiResponseFormat) => Record<string, unknown>;
    /** Tools the provider runs itself, bound alongside the flow's own. */
    serverTools?: unknown[];
    /** What the provider objected to, when its own message is not the whole of it. */
    describeFailure?: (error: unknown) => string;
    /**
     * Why a 200 answer that reports "error" as its finish reason is not an answer.
     * Only a provider that answers that way at all sets this.
     */
    cutShort?: string;
}

/**
 * A model node's return value: the sub flow an agent invokes to call the model.
 *
 * Hercules only turns a returned value into a sub flow when it is a sub flow function
 * definition, so the provider call is wrapped in one rather than handed over as a
 * closure.
 */
export function toModelTransform(options: ModelTransformOptions): AiModelTransform {
    const { provider, prefix, identifier, model } = options;
    const log = logger(`model:${prefix}`);
    const native: boolean = options.responseFormat !== undefined;

    // What the agent reads to decide how to get a structured answer: carrying
    // "response_format" is this node saying its provider can constrain its own
    // output, and dropping it sends the agent down the tool call instead. It has to
    // reach the agent as a schema, because a sub flow carries nothing else.
    const requestSchema = native ? AiModelRequestSchema : AiModelRequestSchema.omit({ response_format: true });

    return {
        // A readable name, since this is what a flow and the agent's logs show the
        // model call under; the identifier alone would not say whose model it is.
        name: `${provider} model ${identifier}`,
        description:
            `Sends a conversation and the tools that may be called to the ${provider} model ` +
            `"${identifier}" and returns the one message it answers with.`,
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
            const bindable: unknown[] = [...tools, ...(options.serverTools ?? [])];
            const bound: BoundModel = bindable.length > 0 ? model.bindTools(bindable as never) : model;
            const messages: BaseMessage[] = parsed.messages.map(toLangChainMessage);

            // The type the answer has to come back in. A provider that constrains the
            // generation itself cannot answer anything but matching JSON, so the agent
            // needs no tool call to get a structured answer out of it - and a provider
            // that cannot do it never sees the field, because its node declared no
            // dialect to write it in and the agent was told as much.
            const format: AiResponseFormat | undefined = native ? parsed.response_format : undefined;
            const formatOptions: Record<string, unknown> =
                format && options.responseFormat ? options.responseFormat(format) : {};

            // What a model answered is only half of a failed run: whether it was asked
            // to call a tool at all, and whether it then did, is the other half, and
            // only this node sees both.
            log.debug(`calling "${identifier}" with`, {
                messages: parsed.messages.length,
                tools: bindable.length,
                tool_choice: parsed.tool_choice,
                response_format: format?.name,
            });

            const answer: AIMessage = await bound
                .invoke(messages, {
                    ...(parsed.stop ? { stop: parsed.stop } : {}),
                    ...(parsed.tool_choice ? { tool_choice: parsed.tool_choice } : {}),
                    ...formatOptions,
                } as never)
                .catch((error: unknown) => {
                    // Which parameter a provider refused is only answerable against
                    // what was actually sent, and a rejected call is exactly when
                    // nobody can reconstruct that from the flow.
                    log.error(`the call to "${identifier}" was rejected, having sent`, {
                        tools: bindable,
                        tool_choice: parsed.tool_choice,
                        response_format: format,
                    });
                    throw new RuntimeError(
                        "ERROR_AI_MODEL_CALL_FAILED",
                        `The ${provider} call to "${identifier}" failed: ${(options.describeFailure ?? describeError)(error)}`,
                    );
                });

            const reply = toFlowMessage(answer);
            const metadata = answer.response_metadata as { finish_reason?: unknown } | undefined;
            log.debug(`"${identifier}" answered with`, {
                blocks: (reply.content ?? []).map((block) => block.type),
                tool_calls: (reply.content ?? [])
                    .filter((block) => block.type === "tool_call")
                    .map((block) => block.name),
                finish_reason: metadata?.finish_reason,
            });

            // A provider that gave up mid-generation can still answer 200, with
            // whatever text it had produced and "error" as the finish reason. Taken at
            // face value that is a valid answer, and the run fails later and elsewhere
            // - the agent gets blamed for not answering in the type it was asked for,
            // when in truth it was never asked. The finish reason is the only place
            // this is visible, so it is read here, where the provider's own vocabulary
            // still applies.
            if (options.cutShort && metadata?.finish_reason === "error") {
                throw new RuntimeError(
                    "ERROR_AI_MODEL_CALL_FAILED",
                    `The ${provider} call to "${identifier}" was cut short: ${options.cutShort}`,
                );
            }

            return { message: reply };
        },
    };
}
