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

/**
 * A key the server never reads.
 *
 * The OpenAI client refuses to be built without one and falls back to the process
 * environment, where a key meant for OpenAI itself would then be sent to a server of
 * your own. A proxy that authenticates nobody gets this instead.
 */
const NO_API_KEY = "none";

@Identifier("ai::model::litellm")
@DisplayIcon("thesvg:vllm/mono")
@Signature(
    "(model: TEXT, server_url: TEXT, api_key?: TEXT, temperature?: NUMBER, max_answer_length?: NUMBER, enforce_answer_type?: BOOLEAN): TRANSFORM<AI_MODEL_REQUEST, AI_MODEL_RESPONSE>",
)
@Name({ code: "en-US", content: "LiteLLM model" })
@Description({
    code: "en-US",
    content:
        "The model an agent thinks with, served by a LiteLLM proxy or anything else that speaks the OpenAI protocol - vLLM, llama.cpp, LM Studio. Give the result to an agent as its model.",
})
@DisplayMessage({ code: "en-US", content: "LiteLLM ${model}" })
@ThrowsError()
@Parameter({
    runtimeName: "model",
    name: [{ code: "en-US", content: "Model" }],
    description: [
        {
            code: "en-US",
            content:
                "The model as that server names it - a LiteLLM deployment alias, a vLLM model path, \"qwen3:8b\". Whatever the server lists under /v1/models is what it accepts here.",
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
                "Where the requests go, up to and including the version segment - \"http://litellm:4000/v1\", \"http://vllm.ai.svc:8000/v1\". The paths below it are the protocol's own, so leave them off.",
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
                "The key the requests are sent with, if the server asks for one - a LiteLLM virtual key, say. Keep it in a secret. Left empty no key is sent, which suits a server in your own network.",
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
    runtimeName: "enforce_answer_type",
    name: [{ code: "en-US", content: "Enforce the answer type" }],
    description: [
        {
            code: "en-US",
            content:
                "Lets the server itself hold the answer to the type the agent asked for, the way OpenAI does. Off unless switched on - while off the type is asked for as a tool, which more servers support.",
        },
    ],
    optional: true,
})
export class LiteLlmModelFunction {
    run(
        _context: FunctionContext,
        model: string,
        server_url: string,
        api_key?: string,
        temperature?: number,
        max_answer_length?: number,
        enforce_answer_type?: boolean,
    ): AiModelTransform {
        const identifier: string = requireText(
            model,
            "ERROR_INVALID_AI_MODEL",
            "A LiteLLM model needs a model identifier.",
        );
        const baseURL: string = requireText(
            server_url,
            "ERROR_INVALID_AI_MODEL",
            "A LiteLLM model needs the address of the server serving it.",
        );
        const chat: ChatOpenAI = new ChatOpenAI({
            model: identifier,
            apiKey: api_key && api_key.trim().length > 0 ? api_key : NO_API_KEY,
            configuration: { baseURL },
            temperature,
            maxTokens: max_answer_length,
        });

        return toModelTransform({
            provider: "LiteLLM",
            prefix: "litellm",
            identifier,
            model: chat as never,
            // Left out unless the node says the server can do it: a server that
            // cannot gets the agent's forced tool call instead of a rejection.
            ...(enforce_answer_type === true
                ? {
                      responseFormat: (format: AiResponseFormat) => ({
                          response_format: toJsonSchemaFormat(format),
                      }),
                  }
                : {}),
        });
    }
}
