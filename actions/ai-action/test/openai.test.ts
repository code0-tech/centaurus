import "reflect-metadata";
import type { ActionFlow } from "@code0-tech/tucana/aquila";
import type { FunctionContext, PlainValue } from "@code0-tech/hercules";
import { afterEach, describe, expect, it } from "vitest";
import type { AiChatRequest } from "../src/datatypes/chat/Chat.request.datatype.js";
import type { AiChatResponse } from "../src/datatypes/chat/Chat.response.datatype.js";
import type { AiModelRequest } from "../src/datatypes/model/Model.request.datatype.js";
import { CreateAgentFunction } from "../src/runtimefunctions/agent/Agent.create.runtimefunction.js";
import { AiOpenAiServerRuntimeEvent } from "../src/runtimeevents/openai/OpenAi.server.runtimeevent.js";
import { OpenAiOpenWebUiFormattingFunction } from "../src/runtimefunctions/openai/OpenAi.openWebUiFormatting.runtimefunction.js";
import { OpenAiRespondFunction } from "../src/runtimefunctions/openai/OpenAi.respond.runtimefunction.js";
import { normalizeRoute } from "../src/utils/openai/OpenAi.normalizeRoute.util.js";
import { toEndpoints } from "../src/utils/openai/OpenAi.toEndpoints.util.js";
import { OpenAiServer } from "../src/server/openai/OpenAi.server.js";
import { parseRequestPath } from "../src/utils/openai/OpenAi.parsePath.util.js";
import { toChatResponse } from "../src/utils/chat/Chat.toChatResponse.util.js";
import { toModelList } from "../src/utils/openai/OpenAi.toModelList.util.js";
import { toStreamChunks } from "../src/utils/openai/OpenAi.toStream.util.js";

interface FlowSpec {
    id: number;
    slug: string;
    route?: string;
    model?: string;
    apiKey?: string;
    type?: string;
}

/** A flow as aquila reports it: settings carry protobuf values, not plain text. */
function flow({
    id,
    slug,
    route = "/v1",
    model = "support",
    apiKey,
    type = "ai::openai::server",
}: FlowSpec): ActionFlow {
    const setting = (identifier: string, value: string) => ({
        flowSettingId: identifier,
        value: { kind: { oneofKind: "stringValue" as const, stringValue: value } },
    });

    return {
        flowId: BigInt(id),
        projectId: 1n,
        type,
        projectSlug: slug,
        name: `flow ${id}`,
        settings: [
            ...(route ? [setting("route", route)] : []),
            ...(model ? [setting("model", model)] : []),
            ...(apiKey ? [setting("api_key", apiKey)] : []),
        ],
    } as unknown as ActionFlow;
}

function answer(text: string): AiChatResponse {
    return toChatResponse({ role: "ai", content: [{ type: "text", text }] }, "");
}

const servers: OpenAiServer[] = [];
const respond = new OpenAiRespondFunction();
const formatting = new OpenAiOpenWebUiFormattingFunction();

/**
 * The context a runtime function of a flow is handed. `executionId` is the flow's own
 * execution, which is what ties a respond call to the waiting request - aquila hands
 * a node the id the flow was started with.
 */
function context(executionId = "openai-execution"): FunctionContext {
    return {
        projectId: 1,
        executionId,
        matchedConfig: { projectId: 1, configValues: [], findConfig: () => undefined },
        executeFlow: async () => null,
    };
}

/** A flow run, as the server starts it: the execution it got and what it was handed. */
interface Run {
    executionId: string;
    flowId: bigint;
    payload: PlainValue;
}

/** A server on a free port, with the flows and the answers a test needs. */
async function serve(
    flows: ActionFlow[],
    run: (flow: Run) => Promise<PlainValue> = async () => answer("hello") as never,
): Promise<{ url: (path: string) => string; calls: Run[] }> {
    const calls: Run[] = [];
    let reserved = 0;
    const server = new OpenAiServer(
        {
            flows: () => flows,
            reserveExecutionId: () => `execution-${(reserved += 1)}`,
            executeFlowWithId: (executionId, flowId, payload) => {
                calls.push({ executionId, flowId, payload });
                return run({ executionId, flowId, payload });
            },
        },
        { port: 0, host: "127.0.0.1" },
    );
    await server.listen();
    servers.push(server);

    return { url: (path: string) => `http://127.0.0.1:${server.address}${path}`, calls };
}

afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe("the route a flow is reached under", () => {
    it("reads the project out of the path, because a route is only unique inside one", () => {
        expect(parseRequestPath("/acme/v1/chat/completions")).toEqual({
            slug: "acme",
            route: "/v1",
            kind: "chat_completions",
        });
        expect(parseRequestPath("/acme/v1/models?limit=5")).toEqual({ slug: "acme", route: "/v1", kind: "models" });
        expect(parseRequestPath("/acme/openai/v1/chat/completions")?.route).toEqual("/openai/v1");
        expect(parseRequestPath("/acme/models")?.route).toEqual("");
    });

    it("is unknown without a project or a known endpoint", () => {
        // The first segment is always the project, so this is the project "v1"
        // serving its root - a request only reaches a flow that says so.
        expect(parseRequestPath("/v1/chat/completions")).toEqual({ slug: "v1", route: "", kind: "chat_completions" });
        expect(parseRequestPath("/chat/completions")).toBeUndefined();
        expect(parseRequestPath("/acme/v1/embeddings")).toBeUndefined();
        expect(parseRequestPath("/")).toBeUndefined();
    });

    it("compares a route the way a flow may have typed it", () => {
        expect(["/v1", "v1", "/v1/", "v1/"].map(normalizeRoute)).toEqual(["/v1", "/v1", "/v1", "/v1"]);
    });

    it("leaves out a flow that has no route or no model to be asked for", () => {
        const flows = [
            flow({ id: 1, slug: "acme" }),
            flow({ id: 2, slug: "acme", model: "" }),
            flow({ id: 3, slug: "acme", route: "" }),
            flow({ id: 4, slug: "acme", type: "REST" }),
        ];

        expect(toEndpoints(flows).map((endpoint) => endpoint.flow.flowId)).toEqual([1n]);
    });
});

describe("the OpenAI endpoint", () => {
    it("lists the flows of the route as models, which is what a client asks for first", async () => {
        const { url } = await serve([
            flow({ id: 1, slug: "acme", model: "support" }),
            flow({ id: 2, slug: "acme", model: "triage" }),
            flow({ id: 3, slug: "other", model: "elsewhere" }),
            flow({ id: 4, slug: "acme", route: "/v2", model: "other-route" }),
        ]);

        const response = await fetch(url("/acme/v1/models"));
        const body = (await response.json()) as { object: string; data: { id: string; owned_by: string }[] };

        expect(response.status).toEqual(200);
        expect(body.object).toEqual("list");
        expect(body.data.map((model) => model.id)).toEqual(["support", "triage"]);
        expect(body.data[0].owned_by).toEqual("acme");
    });

    it("runs the flow of the model a client picked and answers with what it returned", async () => {
        const { url, calls } = await serve(
            [flow({ id: 1, slug: "acme", model: "support" }), flow({ id: 2, slug: "acme", model: "triage" })],
            async ({ flowId }) => answer(flowId === 2n ? "triage here" : "support here") as never,
        );

        const response = await fetch(url("/acme/v1/chat/completions"), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ model: "triage", messages: [{ role: "user", content: "hi" }] }),
        });
        const body = (await response.json()) as AiChatResponse;

        expect(response.status).toEqual(200);
        expect(calls.map((call) => call.flowId)).toEqual([2n]);
        // The flow is handed the request itself, which is what ai::agent::create takes.
        expect(calls[0].payload).toMatchObject({ messages: [{ role: "user", content: "hi" }] });
        expect(body.response).toEqual("triage here");
        // A client matches the answer against the model it asked for.
        expect(body.model).toEqual("triage");
    });

    it("serves a route with a single flow without being told the model", async () => {
        const { url, calls } = await serve([flow({ id: 7, slug: "acme", model: "support" })]);

        const response = await fetch(url("/acme/v1/chat/completions"), {
            method: "POST",
            body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
        });

        expect(response.status).toEqual(200);
        expect(calls.map((call) => call.flowId)).toEqual([7n]);
    });

    it("answers a client that asked for a stream as a stream", async () => {
        const { url } = await serve([flow({ id: 1, slug: "acme" })]);

        const response = await fetch(url("/acme/v1/chat/completions"), {
            method: "POST",
            body: JSON.stringify({ model: "support", stream: true, messages: [{ role: "user", content: "hi" }] }),
        });
        const text = await response.text();

        expect(response.headers.get("content-type")).toEqual("text/event-stream");
        expect(text).toContain('"object":"chat.completion.chunk"');
        expect(text).toContain('"content":"hello"');
        expect(text.trimEnd().endsWith("data: [DONE]")).toEqual(true);
    });

    it("tells a client which model does not exist rather than running the wrong flow", async () => {
        const { url, calls } = await serve([
            flow({ id: 1, slug: "acme", model: "support" }),
            flow({ id: 2, slug: "acme", model: "triage" }),
        ]);

        const missing = await fetch(url("/acme/v1/chat/completions"), {
            method: "POST",
            body: JSON.stringify({ model: "nope", messages: [{ role: "user", content: "hi" }] }),
        });
        // Two models on the route, so a request naming none is ambiguous.
        const ambiguous = await fetch(url("/acme/v1/chat/completions"), {
            method: "POST",
            body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
        });

        expect(missing.status).toEqual(404);
        expect(((await missing.json()) as { error: { code: string } }).error.code).toEqual("model_not_found");
        expect(ambiguous.status).toEqual(404);
        expect(calls).toEqual([]);
    });

    it("answers nothing on a route no flow serves", async () => {
        const { url } = await serve([flow({ id: 1, slug: "acme" })]);

        expect((await fetch(url("/other/v1/models"))).status).toEqual(404);
        expect((await fetch(url("/acme/v2/models"))).status).toEqual(404);
        expect((await fetch(url("/acme/v1/embeddings"))).status).toEqual(404);
    });

    it("runs the route's only flow even when a client asks for another name", async () => {
        // A route holds one flow, so there is nothing else the request could mean -
        // and a client that kept an old model name still gets an answer.
        const { url, calls } = await serve([flow({ id: 1, slug: "acme", model: "support" })]);

        const response = await fetch(url("/acme/v1/chat/completions"), {
            method: "POST",
            body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: "hi" }] }),
        });

        expect(response.status).toEqual(200);
        expect(calls.map((call) => call.flowId)).toEqual([1n]);
    });

    it("asks for the key the flow declared", async () => {
        const { url, calls } = await serve([flow({ id: 1, slug: "acme", apiKey: "sk-secret" })]);
        const body = JSON.stringify({ model: "support", messages: [{ role: "user", content: "hi" }] });

        const without = await fetch(url("/acme/v1/chat/completions"), { method: "POST", body });
        const wrong = await fetch(url("/acme/v1/chat/completions"), {
            method: "POST",
            headers: { authorization: "Bearer nope" },
            body,
        });
        const right = await fetch(url("/acme/v1/chat/completions"), {
            method: "POST",
            headers: { authorization: "Bearer sk-secret" },
            body,
        });

        expect([without.status, wrong.status, right.status]).toEqual([401, 401, 200]);
        expect(calls.map((call) => call.flowId)).toEqual([1n]);
        // A client listing models without the key is not shown the guarded one either.
        expect((await fetch(url("/acme/v1/models"))).status).toEqual(401);
        expect((await fetch(url("/acme/v1/models"), { headers: { authorization: "Bearer sk-secret" } })).status).toEqual(
            200,
        );
    });

    it("answers without a key when the flow set none", async () => {
        const { url } = await serve([flow({ id: 1, slug: "acme" })]);

        expect((await fetch(url("/acme/v1/models"))).status).toEqual(200);
    });

    it("answers a preflight before it asks for anything", async () => {
        const { url, calls } = await serve([flow({ id: 1, slug: "acme", apiKey: "sk-secret" })]);

        const preflight = await fetch(url("/acme/v1/chat/completions"), { method: "OPTIONS" });

        expect(preflight.status).toEqual(204);
        expect(preflight.headers.get("access-control-allow-methods")).toContain("POST");
        expect(preflight.headers.get("access-control-allow-headers")).toContain("authorization");
        expect(calls).toEqual([]);
    });

    it("says which method completions take when another one is used", async () => {
        const { url } = await serve([flow({ id: 1, slug: "acme" })]);

        const response = await fetch(url("/acme/v1/chat/completions"));

        expect(response.status).toEqual(405);
        expect(response.headers.get("allow")).toEqual("POST, OPTIONS");
        expect(((await response.json()) as { error: { message: string } }).error.message).toContain("not GET");
    });

    it("rejects a body it cannot answer instead of running the flow", async () => {
        const { url, calls } = await serve([flow({ id: 1, slug: "acme" })]);

        const broken = await fetch(url("/acme/v1/chat/completions"), { method: "POST", body: "{nope" });
        const empty = await fetch(url("/acme/v1/chat/completions"), {
            method: "POST",
            body: JSON.stringify({ model: "support", messages: [] }),
        });
        const wrongMethod = await fetch(url("/acme/v1/chat/completions"));

        expect([broken.status, empty.status, wrongMethod.status]).toEqual([400, 400, 405]);
        expect(calls).toEqual([]);
    });

    it("reports a flow that answered with something else as a failure of the endpoint", async () => {
        const { url } = await serve([flow({ id: 1, slug: "acme" })], async () => ({ nonsense: true }) as never);

        const response = await fetch(url("/acme/v1/chat/completions"), {
            method: "POST",
            body: JSON.stringify({ model: "support", messages: [{ role: "user", content: "hi" }] }),
        });

        expect(response.status).toEqual(502);
        expect(((await response.json()) as { error: { message: string } }).error.message).toMatch(
            /did not answer with a chat response/,
        );
    });
});

describe("the flow a client ends up talking to", () => {
    it("is the agent: the trigger's request goes in, its answer comes back", async () => {
        const seen: AiModelRequest[] = [];
        const model = (async (request: AiModelRequest) => {
            seen.push(request);
            return { message: { role: "ai", content: [{ type: "text", text: "Order A-1 has shipped." }] } };
        }) as never;

        // What a flow of the ideal shape does: take the request the trigger handed it,
        // ask the agent, answer through the respond node - and carry on afterwards,
        // which is exactly what the flow's return value could not express.
        const after: string[] = [];
        const { url } = await serve([flow({ id: 1, slug: "acme", model: "support" })], async ({ executionId, payload }) => {
            const answer = await new CreateAgentFunction().run(
                context(executionId) as never,
                "support",
                "You track orders.",
                model,
                "",
                undefined,
                undefined,
                payload as unknown as AiChatRequest,
            );

            // The respond node of this flow, which knows the request only through the
            // execution it runs as.
            respond.run(context(executionId), answer as never);

            // A node after the answer, whose value is what the flow returns.
            after.push("stored the conversation");
            return "nothing the client should see" as never;
        });

        const response = await fetch(url("/acme/v1/chat/completions"), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                model: "support",
                messages: [
                    { role: "user", content: "where is A-1?" },
                    { role: "assistant", content: "Let me look." },
                    { role: "user", content: "thanks" },
                ],
            }),
        });
        const body = (await response.json()) as AiChatResponse;

        // The client's whole conversation reached the model, after the system prompt.
        expect(seen[0].messages.map((message) => message.role)).toEqual(["system", "human", "ai", "human"]);
        expect(body.choices[0].message).toMatchObject({ role: "assistant", content: "Order A-1 has shipped." });
        expect(body.object).toEqual("chat.completion");
        expect(body.model).toEqual("support");
        // The node after the answer ran, and did not become the answer.
        expect(after).toEqual(["stored the conversation"]);
    });

    it("answers through respond even while the flow is still running", async () => {
        let release: () => void = () => undefined;
        const blocked = new Promise<void>((resolve) => {
            release = resolve;
        });

        const { url } = await serve([flow({ id: 1, slug: "acme", model: "support" })], async ({ executionId }) => {
            respond.run(context(executionId), answer("early") as never);
            // The flow goes on - the client is not kept waiting for it.
            await blocked;
            return null;
        });

        const response = await fetch(url("/acme/v1/chat/completions"), {
            method: "POST",
            body: JSON.stringify({ model: "support", messages: [{ role: "user", content: "hi" }] }),
        });

        expect(((await response.json()) as AiChatResponse).response).toEqual("early");
        release();
    });

    it("does not fail a flow nobody is waiting on, e.g. a manual run", () => {
        expect(() => respond.run(context("never-started-by-the-server"), answer("hi") as never)).not.toThrow();
    });

    it("rejects an answer that is not a chat response", async () => {
        const { url } = await serve([flow({ id: 1, slug: "acme", model: "support" })], async ({ executionId }) => {
            expect(() => respond.run(context(executionId), { nonsense: true } as never)).toThrow(
                /has to be a chat response/,
            );
            return answer("fell back to the return value") as never;
        });

        const response = await fetch(url("/acme/v1/chat/completions"), {
            method: "POST",
            body: JSON.stringify({ model: "support", messages: [{ role: "user", content: "hi" }] }),
        });

        // The respond call failed, so the flow's return value answered instead.
        expect(((await response.json()) as AiChatResponse).response).toEqual("fell back to the return value");
    });
});

describe("what the event offers a flow", () => {
    it("asks for a route and a model, and leaves the key to the flow", () => {
        const settings: { identifier: string; unique?: string; optional?: boolean; defaultValue?: unknown }[] =
            Reflect.getOwnMetadata("hercules:flow_settings", AiOpenAiServerRuntimeEvent) ?? [];
        const byIdentifier = Object.fromEntries(settings.map((setting) => [setting.identifier, setting]));

        expect(settings.map((setting) => setting.identifier)).toEqual(["route", "model", "api_key"]);
        expect(byIdentifier.route).toMatchObject({ unique: "PROJECT", defaultValue: "/v1" });
        expect(byIdentifier.model).toMatchObject({ unique: "PROJECT" });
        expect(byIdentifier.model.optional).toBeUndefined();
        expect(byIdentifier.api_key.optional).toEqual(true);
    });

    it("hands the flow the client's request as a chat request", () => {
        expect(Reflect.getMetadata("hercules:signature", AiOpenAiServerRuntimeEvent)).toEqual(
            "(route: TEXT, model: TEXT, api_key?: TEXT): AI_CHAT_REQUEST",
        );
    });
});

describe("a finished answer as a stream", () => {
    it("sends the content and then the end, because the flow answered in one piece", () => {
        const chunks = toStreamChunks(answer("done"));

        expect(chunks).toHaveLength(3);
        expect(JSON.parse(chunks[0]).choices[0].delta).toEqual({ role: "assistant", content: "done" });
        expect(JSON.parse(chunks[1]).choices[0]).toEqual({ index: 0, delta: {}, finish_reason: "stop" });
        expect(chunks[2]).toEqual("[DONE]");
    });

    it("lists a model once, however many flows carry the name", () => {
        const endpoints = toEndpoints([flow({ id: 1, slug: "acme" }), flow({ id: 2, slug: "acme" })]);

        expect(toModelList(endpoints).data.map((model) => model.id)).toEqual(["support"]);
    });
});

describe("an answer formatted for Open WebUI", () => {
    it("leaves an answer with nothing to show as it is, because there is nothing to fold away", () => {
        const plain = answer("hello");

        expect(formatting.run(context(), plain)).toEqual(plain);
    });

    it("writes the reasoning into the text as a block the client folds, since it reads no field of ours", () => {
        const thinking = toChatResponse(
            {
                role: "ai",
                content: [
                    { type: "reasoning", reasoning: "first\nsecond" },
                    { type: "text", text: "the answer" },
                ],
            },
            "",
        );

        const formatted = formatting.run(context(), thinking);

        expect(formatted.response).toEqual(
            '<details type="reasoning" done="true">\n<summary>Thought</summary>\n> first\n> second\n</details>\nthe answer',
        );
        expect(formatted.choices[0].message.content).toEqual(formatted.response);
        // The fields stay data, so a flow reading them after this node still gets the
        // reasoning rather than the markup around it.
        expect(formatted.reasoning).toEqual("first\nsecond");
    });

    it("writes one block per tool the agent used, with its arguments and what came back", () => {
        const used: AiChatResponse = {
            ...answer("berlin is cold"),
            steps: [
                { name: "weather", args: { city: "Berlin" }, result: "5°C" },
                { name: "broken", error: 'it said "no"' },
            ],
        };

        const formatted = formatting.run(context(), used);

        expect(formatted.response).toContain(
            '<details type="tool_calls" done="true" id="0" name="weather" arguments="{&quot;city&quot;:&quot;Berlin&quot;}" result="&quot;5°C&quot;">',
        );
        expect(formatted.response).toContain("<summary>Tool Executed</summary>");
        // A failure is shown where the result would be, and the quotes in it cannot end
        // the attribute early.
        expect(formatted.response).toContain('result="&quot;it said \\&quot;no\\&quot;&quot;"');
        expect(formatted.response).toContain("<summary>Tool Failed</summary>");
        expect(formatted.response.endsWith("berlin is cold")).toBe(true);
        expect(formatted.steps).toEqual(used.steps);
    });

    it("formats an answer once, so a flow with the node twice does not stack the blocks", () => {
        const used: AiChatResponse = { ...answer("hi"), steps: [{ name: "weather", result: "5°C" }] };

        const once = formatting.run(context(), used);

        expect(formatting.run(context(), once)).toEqual(once);
    });

    it("sends the formatted text to a streaming client, which is the only text it reads", () => {
        const used: AiChatResponse = { ...answer("hi"), steps: [{ name: "weather", result: "5°C" }] };

        const chunks = toStreamChunks(formatting.run(context(), used));

        expect(JSON.parse(chunks[0]).choices[0].delta.content).toContain('<details type="tool_calls"');
    });
});
