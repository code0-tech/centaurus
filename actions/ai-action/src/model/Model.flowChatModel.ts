import { RuntimeError, type SubFlow } from "@code0-tech/hercules";
import type { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import {
    BaseChatModel,
    type BaseChatModelCallOptions,
    type BindToolsInput,
} from "@langchain/core/language_models/chat_models";
import { isAIMessage, type AIMessageChunk, type BaseMessage } from "@langchain/core/messages";
import { isLangChainTool } from "@langchain/core/tools";
import { toJsonSchema } from "@langchain/core/utils/json_schema";
import type { ChatResult } from "@langchain/core/outputs";
import type { Runnable } from "@langchain/core/runnables";
import type { ModelProfile } from "@langchain/core/language_models/profile";
import type { AiModelRequest } from "../datatypes/model/Model.request.datatype.js";
import type { AiResponseFormat } from "../datatypes/model/Model.responseFormat.datatype.js";
import type { AiToolSpec } from "../datatypes/model/Model.toolSpec.datatype.js";
import { AiModelResponseSchema } from "../datatypes/model/Model.response.datatype.js";
import { parseOrThrow } from "../utils/shared/Shared.parseOrThrow.util.js";
import { stripUndefined } from "../utils/shared/Shared.stripUndefined.util.js";
import { toFlowMessage } from "../utils/message/Message.toFlowMessage.util.js";
import { toLangChainMessage } from "../utils/message/Message.toLangChainMessage.util.js";
import { logger } from "../utils/shared/Log.logger.util.js";
import { emptyJsonSchema } from "../utils/shared/Shared.emptyJsonSchema.util.js";
import { toPlainSchema } from "../utils/shared/Shared.toPlainSchema.util.js";

type BoundFlowChatModel = Runnable<BaseLanguageModelInput, AIMessageChunk, BaseChatModelCallOptions>;

const log = logger("model");

interface FlowChatModelFields {
    run: SubFlow;
    toolSpecs?: AiToolSpec[];
    boundOptions?: Record<string, unknown>;
}

/**
 * The response format a model sub flow is asked for, read off what langchain bound.
 *
 * langchain writes one option per provider dialect - OpenAI's `response_format`,
 * Anthropic's `outputConfig`, Google's `responseSchema` - and a model sub flow is
 * none of those, so the OpenAI-shaped one is unwrapped back into the schema and its
 * name. That is the whole of what a provider needs; which dialect it has to be
 * written in is the model node's business, not ours.
 */
function toResponseFormat(value: unknown): AiResponseFormat | undefined {
    const bound = value as { type?: string; json_schema?: Record<string, unknown> } | undefined;
    if (!bound || typeof bound !== "object" || bound.type !== "json_schema") return undefined;

    const declared: Record<string, unknown> | undefined = bound.json_schema;
    const schema: unknown = declared?.schema;
    if (!schema || typeof schema !== "object") return undefined;

    return stripUndefined({
        name: typeof declared?.name === "string" ? declared.name : "extract",
        schema: schema as Record<string, unknown>,
        description: typeof declared?.description === "string" ? declared.description : undefined,
        strict: typeof declared?.strict === "boolean" ? declared.strict : undefined,
    });
}

export class FlowChatModel extends BaseChatModel<BaseChatModelCallOptions> {
    private readonly run: SubFlow;
    private readonly toolSpecs: AiToolSpec[];
    /**
     * What langchain bound to the model alongside the tools - the tool choice above
     * all. These arrive as the second argument of {@link bindTools} rather than as
     * call options, so they have to be carried on the instance to reach `_generate`.
     */
    private readonly boundOptions: Record<string, unknown>;
    /** Whether the model sub flow declared that it can constrain its own output. */
    private readonly nativeOutput: boolean;

    constructor(fields: FlowChatModelFields) {
        super({});
        this.run = fields.run;
        this.toolSpecs = fields.toolSpecs ?? [];
        this.boundOptions = fields.boundOptions ?? {};

        // A model sub flow is a proxy for a provider this action knows nothing about,
        // so whether a native structured answer is possible cannot be decided here.
        // The only thing that crosses the boundary is the sub flow's declared input
        // schema, and that is enough: a model node that handles `response_format`
        // says so by carrying the field, and one that cannot leaves it out.
        const declared: Record<string, unknown> | undefined = toPlainSchema(fields.run.inputSchema);
        const properties: unknown = declared?.properties;
        this.nativeOutput =
            typeof properties === "object" && properties !== null && "response_format" in properties;
    }

    _llmType(): string {
        return "code0_flow";
    }

    /**
     * What langchain asks before it decides how to get a structured answer: with
     * `structuredOutput` set it hands the schema to the provider and reads the answer
     * back off the message, and without it it binds the schema as an `extract` tool
     * and forces a tool call instead. Both paths work here; this only picks the one
     * the model behind the sub flow can actually serve.
     */
    get profile(): ModelProfile {
        return this.nativeOutput ? { structuredOutput: true } : {};
    }

    /**
     * The second argument is not optional in practice: langchain binds the tool
     * choice through it, and for a structured answer asked for as a tool it binds
     * `tool_choice: "any"` - the only thing that makes the model call the `extract`
     * tool at all. Dropping it leaves the tool merely offered, the model free to
     * answer prose, and the structured answer missing (code0-tech/centaurus: the
     * agent then fails with ERROR_INVALID_AI_AGENT_RESPONSE).
     */
    bindTools(tools: BindToolsInput[], kwargs?: Record<string, unknown>): BoundFlowChatModel {
        const specs: AiToolSpec[] = tools.map((tool): AiToolSpec => {
            const definition = tool as { name?: string; description?: string; input_schema?: unknown; schema?: unknown };
            // A tool can reach the model as a langchain tool, as a bare definition,
            // or - this is how langchain binds the structured output an
            // `output_schema` asks for - in the OpenAI function shape, which carries
            // name, description and schema one level down.
            const wrapped = (tool as { function?: { name?: string; description?: string; parameters?: unknown } })
                .function;
            const fn = wrapped && typeof wrapped === "object" ? wrapped : {};
            const schema: unknown = isLangChainTool(tool)
                ? tool.schema
                : (definition.input_schema ?? definition.schema ?? fn.parameters);

            let inputSchema: Record<string, unknown>;
            if (!schema) {
                inputSchema = emptyJsonSchema();
            } else {
                try {
                    inputSchema = toJsonSchema(schema as never) as Record<string, unknown>;
                } catch {
                    inputSchema = emptyJsonSchema();
                }
            }

            // The schema is whatever the tool declared, so it is stripped with the
            // rest: it travels to the model sub flow as an argument, where
            // `undefined` is rejected.
            return stripUndefined({
                name: definition.name ?? fn.name ?? "unknown",
                description: definition.description ?? fn.description ?? "",
                input_schema: inputSchema,
            });
        });
        log.debug(
            `${specs.length} tools are bound to the model`,
            specs.map((spec) => spec.name),
        );
        return new FlowChatModel({
            run: this.run,
            toolSpecs: specs,
            boundOptions: { ...this.boundOptions, ...kwargs },
        }) as unknown as BoundFlowChatModel;
    }

    async _generate(messages: BaseMessage[], options: this["ParsedCallOptions"]): Promise<ChatResult> {
        // A call option is the more specific of the two, so it wins over what was
        // bound for the whole model.
        const toolChoice: unknown = options.tool_choice ?? this.boundOptions.tool_choice;
        const responseFormat: AiResponseFormat | undefined = toResponseFormat(this.boundOptions.response_format);

        const request: AiModelRequest = {
            messages: messages.map(toFlowMessage),
            tools: this.toolSpecs,
            ...(options.stop ? { stop: options.stop } : {}),
            ...(toolChoice ? { tool_choice: String(toolChoice) } : {}),
            ...(responseFormat ? { response_format: responseFormat } : {}),
        };

        log.debug(`calling the model sub flow with ${request.messages.length} messages`, request);

        const started: number = Date.now();
        const raw: unknown = await this.run(request as never).catch((error: unknown) => {
            log.error(`the model sub flow failed after ${Date.now() - started}ms`, {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        });
        log.debug(`the model sub flow answered after ${Date.now() - started}ms with`, raw);

        const answer = parseOrThrow(
            AiModelResponseSchema,
            (raw as never) ?? {},
            "ERROR_INVALID_AI_MODEL_RESPONSE",
            "The model sub flow did not return a valid model response",
        );

        const message: BaseMessage = toLangChainMessage(answer.message);
        if (!isAIMessage(message)) {
            throw new RuntimeError(
                "ERROR_INVALID_AI_MODEL_RESPONSE",
                `A model sub flow has to answer with an "ai" message, but answered with a "${answer.message.role}" message.`,
            );
        }

        return { generations: [{ text: message.text, message }] };
    }
}
