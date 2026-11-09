import {
    Description,
    DisplayIcon,
    DisplayMessage,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    Signature,
    ThrowsError,
} from "@code0-tech/hercules";
import { ChatOllama } from "@langchain/ollama";
import type { AiModelTransform } from "../../datatypes/model/Model.transform.datatype.js";
import type { AiResponseFormat } from "../../datatypes/model/Model.responseFormat.datatype.js";
import { toModelTransform } from "../../utils/model/Model.toTransform.util.js";
import { requireText } from "../../utils/shared/Shared.requireText.util.js";

const OLLAMA_BASE_URL = "http://127.0.0.1:11434";

@Identifier("ai::model::ollama")
@DisplayIcon("simple:ollama")
@Signature(
    "(model: TEXT, server_url?: TEXT, temperature?: NUMBER, max_conversation_length?: NUMBER): TRANSFORM<AI_MODEL_REQUEST, AI_MODEL_RESPONSE>",
)
@Name({ code: "en-US", content: "Ollama model" })
@Description({
    code: "en-US",
    content:
        "The model an agent thinks with, run by your own Ollama server - no key and no provider. Give the result to an agent as its model. Only a model trained for tools can be an agent's.",
})
@DisplayMessage({ code: "en-US", content: "Ollama ${model}" })
@ThrowsError()
@Parameter({
    runtimeName: "model",
    name: [{ code: "en-US", content: "Model" }],
    description: [
        {
            code: "en-US",
            content:
                "The model as the Ollama server names it, tag and all - \"qwen3:8b\", \"llama3.1:70b\". It has to be pulled on that server already; this node does not fetch it.",
        },
    ],
})
@Parameter({
    runtimeName: "server_url",
    name: [{ code: "en-US", content: "Server address" }],
    description: [
        {
            code: "en-US",
            content:
                "Where the Ollama server listens, for example \"http://ollama:11434\". Left empty, the one on this machine is used - which is the local port, not a server somewhere in the cluster.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "temperature",
    name: [{ code: "en-US", content: "Creativity" }],
    description: [
        {
            code: "en-US",
            content:
                "How freely the model may vary its answers, called temperature. Low values keep answers focused and repeatable, higher ones more varied. Left empty, the model's own default applies.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "max_conversation_length",
    name: [{ code: "en-US", content: "Maximum conversation length" }],
    description: [
        {
            code: "en-US",
            content:
                "How much of the conversation the model may read, in tokens - one token is about three quarters of a word. Ollama's default is small and the rest is dropped silently, so raise it.",
        },
    ],
    optional: true,
})
export class OllamaModelFunction {
    run(
        _context: FunctionContext,
        model: string,
        server_url?: string,
        temperature?: number,
        max_conversation_length?: number,
    ): AiModelTransform {
        const identifier: string = requireText(
            model,
            "ERROR_INVALID_AI_MODEL",
            "An Ollama model needs a model identifier.",
        );
        const chat: ChatOllama = new ChatOllama({
            model: identifier,
            baseUrl: server_url && server_url.trim().length > 0 ? server_url : OLLAMA_BASE_URL,
            temperature,
            ...(max_conversation_length !== undefined ? { numCtx: max_conversation_length } : {}),
        });

        return toModelTransform({
            provider: "Ollama",
            prefix: "ollama",
            identifier,
            model: chat as never,
            // Ollama's dialect for the same thing: the bare JSON schema under
            // "format", with no room for the name or description the agent sent.
            responseFormat: (format: AiResponseFormat) => ({ format: format.schema }),
        });
    }
}
