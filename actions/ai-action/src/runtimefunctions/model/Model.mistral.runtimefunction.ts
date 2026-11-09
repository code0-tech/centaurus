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
import { ChatMistralAI } from "@langchain/mistralai";
import type { AiModelTransform } from "../../datatypes/model/Model.transform.datatype.js";
import { toModelTransform } from "../../utils/model/Model.toTransform.util.js";
import { requireText } from "../../utils/shared/Shared.requireText.util.js";

@Identifier("ai::model::mistral")
@DisplayIcon("simple:mistralai")
@Signature(
    "(model: TEXT, api_key: TEXT, temperature?: NUMBER, max_answer_length?: NUMBER): TRANSFORM<AI_MODEL_REQUEST, AI_MODEL_RESPONSE>",
)
@Name({ code: "en-US", content: "Mistral model" })
@Description({
    code: "en-US",
    content:
        "The model an agent thinks with, called at Mistral. Give the result to an agent as its model. An answer type is asked for as a tool call, so it is checked rather than guaranteed.",
})
@DisplayMessage({ code: "en-US", content: "Mistral ${model}" })
@ThrowsError()
@Parameter({
    runtimeName: "model",
    name: [{ code: "en-US", content: "Model" }],
    description: [
        {
            code: "en-US",
            content:
                "The Mistral model identifier, for example \"mistral-large-latest\" or \"mistral-small-latest\". A \"-latest\" name always means the current version of that model.",
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
                "The Mistral API key the requests are sent with. It is what the usage is billed against, so it belongs in a secret rather than in the node.",
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
export class MistralModelFunction {
    /**
     * This node hands no output type to the provider, and that is deliberate:
     * Mistral's `response_format` takes a JSON mode but no schema through this
     * client, so it cannot promise a constrained answer. Leaving the field out of the
     * request schema is what tells the agent to ask for an output type as a forced
     * tool call instead - which Mistral does support.
     */
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
            "A Mistral model needs a model identifier.",
        );
        const chat: ChatMistralAI = new ChatMistralAI({
            model: identifier,
            apiKey: requireText(api_key, "ERROR_INVALID_AI_MODEL", "A Mistral model needs an API key."),
            temperature,
            maxTokens: max_answer_length,
        });

        return toModelTransform({
            provider: "Mistral",
            prefix: "mistral",
            identifier,
            model: chat as never,
        });
    }
}
