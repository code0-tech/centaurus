import {
    Alias,
    Description,
    DisplayIcon,
    DisplayMessage,
    Editable,
    EventSetting,
    Identifier,
    Name,
    Signature,
    type RuntimeEventRunnable,
} from "@code0-tech/hercules";

/**
 * A flow bound to this event is one model of an OpenAI-compatible endpoint the action
 * serves itself (see {@link startOpenAiServer}). Nothing else hosts it: the action
 * opens the HTTP port, answers `GET /models` from the flows bound here, and runs the
 * matching flow for `POST /chat/completions`.
 *
 * The flow is handed the client's request as an `AI_CHAT_REQUEST` - the type
 * `ai::agent::ask` takes - and answers it with `ai::openai::respond`, from wherever
 * in the flow that belongs, so a flow that logs or stores something after the agent
 * still answers with the agent's reply. A flow that never responds falls back to its
 * own return value.
 *
 * `route` is the path the endpoint lives under, with the project's slug in front of
 * it, and unique per project. `model` is the name a client sees and picks, which every
 * flow has to carry: a client only ever asks for a model, so a flow without one has
 * no name to be asked for. `api_key` is the flow's to set or leave: the server opens
 * a port of its own, so without a key anyone who reaches it can run the flow.
 */
@Identifier("ai::openai::server")
@DisplayIcon("tabler:ai")
@Editable()
@Signature("(route: TEXT, model: TEXT, api_key?: TEXT): AI_CHAT_REQUEST")
@Name({ code: "en-US", content: "OpenAI endpoint" })
@Description({
    code: "en-US",
    content:
        "Serves this flow as a model of an OpenAI-compatible endpoint. Any OpenAI client, Open WebUI among them, can be pointed at the project's path and talk to the flow.",
})
@DisplayMessage({ code: "en-US", content: "OpenAI request for ${model} on ${route}" })
@Alias({ code: "en-US", content: "openai;chat;completions;endpoint;open web ui;llm;api" })
@EventSetting({
    identifier: "route",
    unique: "PROJECT",
    name: [{ code: "en-US", content: "Path" }],
    description: [
        {
            code: "en-US",
            content:
                "The path this endpoint is reached under, \"/v1\" by default. A chat client is given the project's own address followed by this path as its server address, and finds the rest on its own.",
        },
    ],
    defaultValue: "/v1",
})
@EventSetting({
    identifier: "model",
    unique: "PROJECT",
    name: [{ code: "en-US", content: "Model" }],
    description: [
        {
            code: "en-US",
            content:
                "The name chat clients see in their model list and pick, unique in the project. It can say what this flow does rather than name a provider's model; without it the endpoint serves nothing.",
        },
    ],
})
@EventSetting({
    identifier: "api_key",
    optional: true,
    name: [{ code: "en-US", content: "API key" }],
    description: [
        {
            code: "en-US",
            content:
                "The key a client has to send along to be let in. Left empty, anyone who can reach this endpoint can run the flow - only do that where nothing else can reach it.",
        },
    ],
})
export class AiOpenAiServerRuntimeEvent implements RuntimeEventRunnable {}
