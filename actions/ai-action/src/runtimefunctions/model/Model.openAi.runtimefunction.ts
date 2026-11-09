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
import { ChatOpenAI } from "@langchain/openai";
import type { AiModelTransform } from "../../datatypes/model/Model.transform.datatype.js";
import type { AiResponseFormat } from "../../datatypes/model/Model.responseFormat.datatype.js";
import { toJsonSchemaFormat } from "../../utils/model/Model.toJsonSchemaFormat.util.js";
import { toModelTransform } from "../../utils/model/Model.toTransform.util.js";
import { requireText } from "../../utils/shared/Shared.requireText.util.js";

@Identifier("ai::model::openai")
@DisplayIcon("thesvg:openai-chatgpt/mono")
@Signature(
    "(model: TEXT, api_key: TEXT, server_url?: TEXT, temperature?: NUMBER, max_answer_length?: NUMBER): TRANSFORM<AI_MODEL_REQUEST, AI_MODEL_RESPONSE>",
)
@Name({ code: "en-US", content: "OpenAI model" })
@Description({
    code: "en-US",
    content:
        "The model an agent thinks with, called at OpenAI. Give the result to an agent as its model. With another server address it serves anything else that speaks the OpenAI protocol.",
})
@DisplayMessage({ code: "en-US", content: "OpenAI ${model}" })
@ThrowsError()
@Parameter({
    runtimeName: "model",
    name: [{ code: "en-US", content: "Model" }],
    description: [
        {
            code: "en-US",
            content:
                "The model identifier, for example \"gpt-5\" or \"gpt-4.1-mini\". Pointed at another OpenAI-compatible service, it is whatever that service calls the model.",
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
                "The API key the requests are sent with. It is what the usage is billed against, so it belongs in a secret rather than in the node.",
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
                "Where the requests go, for a service that speaks OpenAI's protocol but is not OpenAI - \"http://localhost:11434/v1\" for a server of your own, for instance. Left empty, OpenAI itself is called.",
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
                "How much the model may vary its answers: low values keep them focused and repeatable, higher ones more varied. Left empty the model's default applies - a reasoning model takes only that.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "max_answer_length",
    name: [{ code: "en-US", content: "Maximum answer length" }],
    description: [
        {
            code: "en-US",
            content:
                "The longest a single answer may get, in tokens - one token is about three quarters of a word. An answer that hits the limit is cut off mid-sentence, so cap it only if you must.",
        },
    ],
    optional: true,
})
export class OpenAiModelFunction {
    run(
        _context: FunctionContext,
        model: string,
        api_key: string,
        server_url?: string,
        temperature?: number,
        max_answer_length?: number,
    ): AiModelTransform {
        const identifier: string = requireText(
            model,
            "ERROR_INVALID_AI_MODEL",
            "An OpenAI model needs a model identifier.",
        );
        const chat: ChatOpenAI = new ChatOpenAI({
            model: identifier,
            apiKey: requireText(api_key, "ERROR_INVALID_AI_MODEL", "An OpenAI model needs an API key."),
            ...(server_url && server_url.trim().length > 0 ? { configuration: { baseURL: server_url } } : {}),
            temperature,
            maxTokens: max_answer_length,
        });

        return toModelTransform({
            provider: "OpenAI",
            prefix: "openai",
            identifier,
            model: chat as never,
            responseFormat: (format: AiResponseFormat) => ({ response_format: toJsonSchemaFormat(format) }),
        });
    }
}
