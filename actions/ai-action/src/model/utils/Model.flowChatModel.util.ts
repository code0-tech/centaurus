import { RuntimeError, type SubFlow } from "@code0-tech/hercules";
import type { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import {
    BaseChatModel,
    type BaseChatModelCallOptions,
    type BindToolsInput,
} from "@langchain/core/language_models/chat_models";
import { isAIMessage, type AIMessageChunk, type BaseMessage } from "@langchain/core/messages";
import type { ChatResult } from "@langchain/core/outputs";
import type { Runnable } from "@langchain/core/runnables";
import type { AiModelRequest } from "../datatypes/Model.request.datatype.js";
import type { AiToolSpec } from "../datatypes/Model.toolSpec.datatype.js";
import { AiModelResponseSchema } from "../datatypes/Model.response.datatype.js";
import { parseOrThrow } from "../../shared/utils/Shared.parseOrThrow.util.js";
import { toFlowMessage } from "../../message/utils/Message.toFlowMessage.util.js";
import { toLangChainMessage } from "../../message/utils/Message.toLangChainMessage.util.js";
import { toToolSpec } from "./Model.toToolSpec.util.js";

type BoundFlowChatModel = Runnable<BaseLanguageModelInput, AIMessageChunk, BaseChatModelCallOptions>;

interface FlowChatModelFields {
    run: SubFlow;
    toolSpecs?: AiToolSpec[];
}

export class FlowChatModel extends BaseChatModel<BaseChatModelCallOptions> {
    private readonly run: SubFlow;
    private readonly toolSpecs: AiToolSpec[];

    constructor(fields: FlowChatModelFields) {
        super({});
        this.run = fields.run;
        this.toolSpecs = fields.toolSpecs ?? [];
    }

    _llmType(): string {
        return "code0_flow";
    }

    bindTools(tools: BindToolsInput[]): BoundFlowChatModel {
        return new FlowChatModel({
            run: this.run,
            toolSpecs: tools.map(toToolSpec),
        }) as unknown as BoundFlowChatModel;
    }

    async _generate(messages: BaseMessage[], options: this["ParsedCallOptions"]): Promise<ChatResult> {
        const request: AiModelRequest = {
            messages: messages.map(toFlowMessage),
            tools: this.toolSpecs,
            ...(options.stop ? { stop: options.stop } : {}),
            ...(options.tool_choice ? { tool_choice: String(options.tool_choice) } : {}),
        };

        const answer = parseOrThrow(
            AiModelResponseSchema,
            (await this.run(request as never)) ?? {},
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
