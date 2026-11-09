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
import { ChatGroq } from "@langchain/groq";
import type { AiModelTransform } from "../../datatypes/model/Model.transform.datatype.js";
import type { AiResponseFormat } from "../../datatypes/model/Model.responseFormat.datatype.js";
import { toJsonSchemaFormat } from "../../utils/model/Model.toJsonSchemaFormat.util.js";
import { toModelTransform } from "../../utils/model/Model.toTransform.util.js";
import { requireText } from "../../utils/shared/Shared.requireText.util.js";

@Identifier("ai::model::groq")
@DisplayIcon("thesvg:groq/wordmark")
@Signature(
    "(model: TEXT, api_key: TEXT, temperature?: NUMBER, max_answer_length?: NUMBER): TRANSFORM<AI_MODEL_REQUEST, AI_MODEL_RESPONSE>",
)
@Name({ code: "en-US", content: "Groq model" })
@Description({
    code: "en-US",
    content:
        "The model an agent thinks with, served by Groq - open models on fast hardware. Give the result to an agent as its model. Not every model there accepts tools, so pick a larger one.",
})
@DisplayMessage({ code: "en-US", content: "Groq ${model}" })
@ThrowsError()
@Parameter({
    runtimeName: "model",
    name: [{ code: "en-US", content: "Model" }],
    description: [
        {
            code: "en-US",
            content:
                "The Groq model identifier, for example \"llama-3.3-70b-versatile\" or \"openai/gpt-oss-120b\". Groq serves open models, so this is the model's own name rather than Groq's.",
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
                "The Groq API key the requests are sent with. It is what the usage is billed against, so it belongs in a secret rather than in the node.",
        },
    ],
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
export class GroqModelFunction {
    run(
        _context: FunctionContext,
        model: string,
        api_key: string,
        temperature?: number,
        max_answer_length?: number,
    ): AiModelTransform {
        const identifier: string = requireText(
            model,
            "ERROR_INVALID_AI_MODEL",
            "A Groq model needs a model identifier.",
        );
        const chat: ChatGroq = new ChatGroq({
            model: identifier,
            apiKey: requireText(api_key, "ERROR_INVALID_AI_MODEL", "A Groq model needs an API key."),
            temperature,
            maxTokens: max_answer_length,
        });

        return toModelTransform({
            provider: "Groq",
            prefix: "groq",
            identifier,
            model: chat as never,
            responseFormat: (format: AiResponseFormat) => ({ response_format: toJsonSchemaFormat(format) }),
        });
    }
}
