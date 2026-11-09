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
import { ChatAnthropic } from "@langchain/anthropic";
import type { AiModelTransform } from "../../datatypes/model/Model.transform.datatype.js";
import type { AiResponseFormat } from "../../datatypes/model/Model.responseFormat.datatype.js";
import { toModelTransform } from "../../utils/model/Model.toTransform.util.js";
import { requireText } from "../../utils/shared/Shared.requireText.util.js";

/**
 * Anthropic's own web search, as a server tool: Anthropic runs the search and hands
 * the model the results, so the flow needs no search tool and no key of its own. The
 * model still decides for itself whether to search at all.
 */
const WEB_SEARCH_TOOL = { type: "web_search_20250305", name: "web_search" } as const;

@Identifier("ai::model::anthropic")
@DisplayIcon("simple:anthropic")
@Signature(
    "(model: TEXT, api_key: TEXT, temperature?: NUMBER, max_answer_length?: NUMBER, web_search?: BOOLEAN): TRANSFORM<AI_MODEL_REQUEST, AI_MODEL_RESPONSE>",
)
@Name({ code: "en-US", content: "Anthropic model" })
@Description({
    code: "en-US",
    content:
        "The model an agent thinks with, called at Anthropic - the Claude models. Give the result to an agent as its model. It can also let the model search the web through Anthropic.",
})
@DisplayMessage({ code: "en-US", content: "Anthropic ${model}" })
@ThrowsError()
@Parameter({
    runtimeName: "model",
    name: [{ code: "en-US", content: "Model" }],
    description: [
        {
            code: "en-US",
            content:
                "The Claude model identifier, for example \"claude-sonnet-5\" or \"claude-haiku-4-5\". A bare family name without a date always means the current model of that family.",
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
                "The Anthropic API key the requests are sent with. It is what the usage is billed against, so it belongs in a secret rather than in the node.",
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
                "The longest a single answer may get, in tokens - about three quarters of a word each. Anthropic always needs a limit, so one is used when this is empty; raise it for long answers.",
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
                "Lets the model search the web through Anthropic, which runs the search for it - no search tool and no key of your own needed. Off unless switched on; the model decides whether to search.",
        },
    ],
    optional: true,
})
export class AnthropicModelFunction {
    run(
        _context: FunctionContext,
        model: string,
        api_key: string,
        temperature?: number,
        max_answer_length?: number,
        web_search?: boolean,
    ): AiModelTransform {
        const identifier: string = requireText(
            model,
            "ERROR_INVALID_AI_MODEL",
            "An Anthropic model needs a model identifier.",
        );
        const chat: ChatAnthropic = new ChatAnthropic({
            model: identifier,
            apiKey: requireText(api_key, "ERROR_INVALID_AI_MODEL", "An Anthropic model needs an API key."),
            temperature,
            ...(max_answer_length !== undefined ? { maxTokens: max_answer_length } : {}),
        });

        return toModelTransform({
            provider: "Anthropic",
            prefix: "anthropic",
            identifier,
            model: chat as never,
            // Anthropic's own dialect for the same thing OpenAI calls
            // "response_format": the schema travels under the output config, and
            // what it does not carry - a name, a description, "strict" - Anthropic
            // has no field for, so it is dropped rather than smuggled in.
            responseFormat: (format: AiResponseFormat) => ({
                outputConfig: { format: { type: "json_schema", schema: format.schema } },
            }),
            serverTools: web_search === true ? [WEB_SEARCH_TOOL] : [],
        });
    }
}
