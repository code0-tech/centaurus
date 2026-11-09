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
import { toModelTransform } from "../../utils/model/Model.toTransform.util.js";
import { toJsonSchemaFormat } from "../../utils/model/Model.toJsonSchemaFormat.util.js";
import { describeError } from "../../utils/shared/Shared.describeError.util.js";
import { requireText } from "../../utils/shared/Shared.requireText.util.js";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

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
 * Why a 200 answer is not always an answer here, and what that usually means.
 */
const CUT_SHORT =
    'the provider gave up mid-generation and reported "error" as the finish reason. This is what a model that cannot serve a parameter it was given does, so the usual cause is a request it does not support - a tool the model has to call above all, which is how an answer type is asked for from a model that cannot hold its own answer to one.';

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

@Identifier("ai::model::openrouter")
@DisplayIcon("simple:openrouter")
@Signature(
    "(model: TEXT, api_key: TEXT, temperature?: NUMBER, max_answer_length?: NUMBER, web_search?: BOOLEAN): TRANSFORM<AI_MODEL_REQUEST, AI_MODEL_RESPONSE>",
)
@Name({ code: "en-US", content: "OpenRouter model" })
@Description({
    code: "en-US",
    content:
        "The model an agent thinks with, served through OpenRouter - one key for every provider it routes to. Give the result to an agent as its model; the model is the only choice here.",
})
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
@Parameter({
    runtimeName: "web_search",
    name: [{ code: "en-US", content: "Web search" }],
    description: [
        {
            code: "en-US",
            content:
                "Lets the model search the web through OpenRouter, which runs the search for it - no search tool and no key of your own needed. Off unless switched on; the model decides whether to search.",
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
        max_answer_length?: number,
        web_search?: boolean,
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
            maxTokens: max_answer_length,
            modelKwargs: { ...REQUIRE_SUPPORTED_PARAMETERS },
        });

        return toModelTransform({
            provider: "OpenRouter",
            prefix: "openrouter",
            identifier,
            model: chat as never,
            // "strict" is forwarded as asked for, which means OpenAI requires every
            // nested object to close itself with "additionalProperties": false
            // rather than answering loosely.
            responseFormat: (format: AiResponseFormat) => ({ response_format: toJsonSchemaFormat(format) }),
            serverTools: web_search === true ? [WEB_SEARCH_TOOL] : [],
            describeFailure: describeProviderError,
            cutShort: CUT_SHORT,
        });
    }
}
