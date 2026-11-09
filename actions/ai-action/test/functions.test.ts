import "reflect-metadata";
import { RuntimeError, type FunctionContext, type SubFlow } from "@code0-tech/hercules";
import { describe, expect, it, vi } from "vitest";
import { AIMessage } from "@langchain/core/messages";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { toJsonSchema } from "@langchain/core/utils/json_schema";
import type { AiContentBlock } from "../src/datatypes/message/Message.contentBlock.datatype.js";
import type { AiMessage } from "../src/datatypes/message/Message.datatype.js";
import { AiChatResponseSchema } from "../src/datatypes/chat/Chat.response.datatype.js";
import type { AiModelRequest } from "../src/datatypes/model/Model.request.datatype.js";
import { AiModelResponseSchema, type AiModelResponse } from "../src/datatypes/model/Model.response.datatype.js";
import { AiStateUpdateSchema } from "../src/datatypes/middleware/Middleware.stateUpdate.datatype.js";
import { TrimMessagesMiddlewareFunction } from "../src/runtimefunctions/middleware/Middleware.trimMessages.runtimefunction.js";
import { AnthropicModelFunction } from "../src/runtimefunctions/model/Model.anthropic.runtimefunction.js";
import { GroqModelFunction } from "../src/runtimefunctions/model/Model.groq.runtimefunction.js";
import { MistralModelFunction } from "../src/runtimefunctions/model/Model.mistral.runtimefunction.js";
import { OllamaModelFunction } from "../src/runtimefunctions/model/Model.ollama.runtimefunction.js";
import { OpenAiModelFunction } from "../src/runtimefunctions/model/Model.openAi.runtimefunction.js";
import { OpenRouterModelFunction } from "../src/runtimefunctions/model/Model.openRouter.runtimefunction.js";
import { AskAgentFunction } from "../src/runtimefunctions/agent/Agent.ask.runtimefunction.js";
import { McpServerFunction } from "../src/runtimefunctions/mcp/Mcp.server.runtimefunction.js";
import { AiMcpServerSchema } from "../src/datatypes/mcp/Mcp.server.datatype.js";

const model = new OpenRouterModelFunction();
const middleware = new TrimMessagesMiddlewareFunction();
const ask = new AskAgentFunction();
const mcp = new McpServerFunction();

/**
 * Mirrors how hercules hands a sub flow function from one node to the next: the
 * producing node returns a sub flow function definition, the consuming node receives
 * a callable sub flow.
 */
function asFlowValue<R>(definition: { run: (...args: never[]) => R | Promise<R> }): (...args: unknown[]) => Promise<R> {
    const call = definition.run.bind(definition) as unknown as (...args: unknown[]) => R | Promise<R>;
    return (...args: unknown[]) => Promise.resolve(call(...args));
}

function context(): FunctionContext {
    return {
        projectId: 1,
        executionId: "functions-execution",
        matchedConfig: { projectId: 1, configValues: [], findConfig: () => undefined },
        executeFlow: async () => null,
    };
}

function state(count: number, hook: "before_model" | "after_model" = "before_model") {
    const text = (value: string) => [{ type: "text", text: value }];
    const messages: AiMessage[] = [{ role: "system", content: text("You are helpful.") }];
    for (let turn = 0; turn < count; turn += 1) {
        messages.push({ role: "human", content: text(`question ${turn} ${"padding ".repeat(40)}`) });
        messages.push({ role: "ai", content: text(`answer ${turn} ${"padding ".repeat(40)}`) });
    }
    return { messages, agent_name: "support", hook };
}

describe("ai::model::openrouter", () => {
    it("returns a sub flow function definition, which is what hercules can serialize", () => {
        const transform = model.run(context(), "anthropic/claude-opus-5", "sk-or-test");

        expect(typeof transform.run).toEqual("function");
        expect(transform.name).toEqual("openrouter:anthropic/claude-opus-5");
        expect(transform.inputSchema).toBeDefined();
        expect(transform.outputSchema).toBeDefined();
    });

    it("needs a model identifier and an API key", () => {
        expect(() => model.run(context(), "", "key")).toThrow(RuntimeError);
        expect(() => model.run(context(), "anthropic/claude-opus-5", "")).toThrow(RuntimeError);
    });

    it("rejects a call whose argument is not a model request", async () => {
        const transform = model.run(context(), "anthropic/claude-opus-5", "sk-or-test");
        await expect(transform.run({ messages: [] } as never)).rejects.toThrow(/model request is not valid/);
    });

    it("reports a failed call as a runtime error rather than leaking the provider's", async () => {
        const transform = model.run(context(), "anthropic/claude-opus-5", "sk-or-invalid-key-for-test");
        await expect(
            transform.run({ messages: [{ role: "human", content: [{ type: "text", text: "hi" }] }], tools: [] } as never),
        ).rejects.toThrow(RuntimeError);
    }, 30_000);

    it("hands the provider's own web search to the model only when it is switched on", async () => {
        const answer = new AIMessage("ok");
        const bindTools = vi
            .spyOn(ChatOpenAI.prototype, "bindTools")
            .mockReturnValue({ invoke: async () => answer } as never);
        vi.spyOn(ChatOpenAI.prototype, "invoke").mockResolvedValue(answer as never);
        const request = { messages: [{ role: "human", content: [{ type: "text", text: "hi" }] }], tools: [] };

        await model.run(context(), "anthropic/claude-opus-5", "sk-or-test").run(request as never);
        expect(bindTools).not.toHaveBeenCalled();

        await model
            .run(context(), "anthropic/claude-opus-5", "sk-or-test", undefined, undefined, true)
            .run(request as never);
        expect(bindTools).toHaveBeenCalledWith([{ type: "openrouter:web_search" }]);

        vi.restoreAllMocks();
    });

    it("declares that it can constrain its own output, which is how OpenRouter serves an output type", () => {
        // The declared request schema is what the agent reads to choose between
        // asking the provider for the type and binding it as a tool call.
        const properties = (schema: unknown): string[] =>
            Object.keys((toJsonSchema(schema as never) as { properties?: object }).properties ?? {});

        expect(properties(model.run(context(), "openai/gpt-oss-120b", "sk-or-test").inputSchema)).toContain(
            "response_format",
        );
    });

    it("asks the provider for the output type the agent wants", async () => {
        const answer = new AIMessage("ok");
        const invoke = vi.spyOn(ChatOpenAI.prototype, "invoke").mockResolvedValue(answer as never);
        const request = {
            messages: [{ role: "human", content: [{ type: "text", text: "hi" }] }],
            tools: [],
            response_format: { name: "extract", schema: { type: "object", properties: {} } },
        };

        await model.run(context(), "openai/gpt-oss-120b", "sk-or-test").run(request as never);
        expect(invoke.mock.calls[0]?.[1]).toMatchObject({ response_format: { type: "json_schema" } });

        vi.restoreAllMocks();
    });

    it("fails a call the provider gave up on, rather than passing its half answer off as an answer", async () => {
        const cutShort = new AIMessage({
            content: "Here's a user object: { }",
            response_metadata: { finish_reason: "error" },
        });
        vi.spyOn(ChatOpenAI.prototype, "invoke").mockResolvedValue(cutShort as never);

        const transform = model.run(context(), "openai/gpt-oss-120b", "sk-or-test");
        await expect(
            transform.run({
                messages: [{ role: "human", content: [{ type: "text", text: "hi" }] }],
                tools: [],
            } as never),
        ).rejects.toThrow(/gave up mid-generation/);

        vi.restoreAllMocks();
    });

    it("routes only to a provider that supports what the request carries", async () => {
        const answer = new AIMessage("ok");
        const invoke = vi.spyOn(ChatOpenAI.prototype, "invoke").mockResolvedValue(answer as never);

        await model
            .run(context(), "openai/gpt-oss-120b", "sk-or-test")
            .run({ messages: [{ role: "human", content: [{ type: "text", text: "hi" }] }], tools: [] } as never);

        // OpenRouter serves one model from many endpoints with different parameter
        // support, so without this a tool call or an output type reaches one that
        // cannot serve it.
        const model_ = invoke.mock.instances[0] as ChatOpenAI;
        expect(model_.modelKwargs).toMatchObject({ provider: { require_parameters: true } });

        vi.restoreAllMocks();
    });

    it("is accepted by ai::agent::ask as the agent's model", async () => {
        const transform = model.run(context(), "anthropic/claude-opus-5", "sk-or-test");

        // Reaches the model, which rejects the test key - proof the agent accepted it.
        await expect(
            ask.run(context(), "support", "You are helpful.", asFlowValue(transform), "hi"),
        ).rejects.toThrow(RuntimeError);
    }, 30_000);
});

describe("ai::middleware::trim_messages", () => {
    it("returns a sub flow function definition, which is what hercules can serialize", () => {
        const transform = middleware.run(context(), 200);

        expect(typeof transform.run).toEqual("function");
        expect(transform.name).toEqual("trim_messages:last:200");
        expect(transform.inputSchema).toBeDefined();
        expect(transform.outputSchema).toBeDefined();
    });

    it("rejects a budget that is not a positive number", () => {
        expect(() => middleware.run(context(), 0)).toThrow(RuntimeError);
        expect(() => middleware.run(context(), Number.NaN)).toThrow(RuntimeError);
    });

    it("rejects an end of the conversation it has no meaning for", () => {
        expect(() => middleware.run(context(), 500, "middle")).toThrow(/not an end of the conversation/);
    });

    it("keeps the oldest messages when asked to, under either name for that end", () => {
        expect(middleware.run(context(), 500, "oldest").name).toEqual("trim_messages:first:500");
        expect(middleware.run(context(), 500, "first").name).toEqual("trim_messages:first:500");
    });

    it("returns no change when the conversation already fits", async () => {
        const update = await middleware.run(context(), 100_000).run(state(1));
        expect(update).toEqual({});
    });

    it("drops whole messages until the conversation fits the budget", async () => {
        const before = state(12);
        const update = await middleware.run(context(), 200).run(before);

        const parsed = AiStateUpdateSchema.parse(update);
        expect(parsed.messages).toBeDefined();
        expect(parsed.messages!.length).toBeLessThan(before.messages.length);
        expect(parsed.messages!.at(-1)?.content).toEqual(before.messages.at(-1)?.content);
    });

    it("keeps the instructions when it trims", async () => {
        const update = await middleware.run(context(), 200, "newest", true).run(state(12));
        const parsed = AiStateUpdateSchema.parse(update);
        expect(parsed.messages![0].role).toEqual("system");
    });

    it("rejects a state that is not an agent state", async () => {
        const transform = middleware.run(context(), 500);
        await expect(transform.run({ messages: [] } as never)).rejects.toThrow(/agent state is not valid/);
    });

    it("produces an update the agent will accept", async () => {
        const update = await middleware.run(context(), 200).run(state(12));
        expect(() => AiStateUpdateSchema.parse(update)).not.toThrow();
    });
});

describe("ai::mcp::server", () => {
    it("describes a server the agent node can use as a tool", () => {
        const server = mcp.run(context(), "tickets", "https://example.com/mcp", "token-1");

        expect(() => AiMcpServerSchema.parse(server)).not.toThrow();
        expect(server.transport).toEqual("http");
        expect(server.url).toEqual("https://example.com/mcp");
        expect(server.headers).toEqual({ Authorization: "Bearer token-1" });
    });

    it("reads the older protocol off the address, since nothing else announces it", () => {
        expect(mcp.run(context(), "tickets", "https://example.com/sse").transport).toEqual("sse");
        expect(mcp.run(context(), "tickets", "https://example.com/mcp").transport).toEqual("http");
    });

    it("sends what a server asked for on top of the access token", () => {
        const server = mcp.run(context(), "tickets", "https://example.com/mcp", "token-1", {
            "X-Api-Key": "key-1",
        });

        expect(server.headers).toEqual({ Authorization: "Bearer token-1", "X-Api-Key": "key-1" });
    });

    it("reads headers that arrive as a protobuf struct, which is how a flow may hand them over", () => {
        const server = mcp.run(context(), "tickets", "https://example.com/mcp", undefined, {
            fields: { "X-Api-Key": { kind: { oneofKind: "stringValue", stringValue: "key-1" } } },
        });

        expect(server.headers).toEqual({ "X-Api-Key": "key-1" });
    });

    it("limits the agent to the tools that were named, and leaves it everything otherwise", () => {
        const limited = mcp.run(context(), "tickets", "https://example.com/mcp", undefined, undefined, ["search"]);

        expect(limited.allowed_tools).toEqual(["search"]);
        expect(mcp.run(context(), "tickets", "https://example.com/mcp").allowed_tools).toBeUndefined();
    });

    it("fails on the node rather than when the agent starts working", () => {
        expect(() => mcp.run(context(), "", "https://example.com/mcp")).toThrow(/needs a name/);
        expect(() => mcp.run(context(), "tickets", "example.com/mcp")).toThrow(/not a web address/);
        expect(() => mcp.run(context(), "tickets", "ftp://example.com/mcp")).toThrow(/http:\/\/ or https:\/\//);
        expect(() =>
            mcp.run(context(), "tickets", "https://example.com/mcp", undefined, { "X-Api-Key": 1 }),
        ).toThrow(/has to be a text/);
    });
});

describe("the contracts the functions implement", () => {
    it("the model function's output is a valid AI_MODEL_RESPONSE", () => {
        expect(() =>
            AiModelResponseSchema.parse({
                message: {
                    role: "ai",
                    content: [
                        { type: "reasoning", reasoning: "thinking it through" },
                        { type: "tool_call", id: "call_0", name: "tool_1", args: { q: "x" } },
                    ],
                    response_metadata: { finish_reason: "tool_calls" },
                    usage_metadata: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
                },
            }),
        ).not.toThrow();
    });
});

describe("the chat format of ai::agent::ask", () => {
    function scriptedModel(responses: AiModelResponse[]) {
        const requests: AiModelRequest[] = [];
        let call = 0;
        const run = (async (input: never) => {
            requests.push(input as unknown as AiModelRequest);
            return responses[Math.min(call++, responses.length - 1)];
        }) as unknown as SubFlow;
        return { run, requests };
    }

    function generation(content: AiContentBlock[], usage?: Record<string, number>): AiModelResponse {
        return {
            message: {
                role: "ai",
                content,
                response_metadata: { model_name: "anthropic/claude-opus-5" },
                ...(usage ? { usage_metadata: usage } : {}),
            },
        };
    }

    it("answers an OpenAI request with an OpenAI chat completion", async () => {
        const { run, requests } = scriptedModel([
            generation([{ type: "text", text: "Hi there." }], {
                input_tokens: 11,
                output_tokens: 3,
                total_tokens: 14,
            }),
        ]);
        const response = await ask.run(
            context(),
            "greeter",
            "You greet people.",
            run,
            "hello",
            undefined,
            undefined,
            { model: "my-agent", messages: [{ role: "system", content: "Be brief." }] },
        );

        const parsed = AiChatResponseSchema.parse(response);
        expect(parsed.object).toEqual("chat.completion");
        expect(parsed.model).toEqual("anthropic/claude-opus-5");
        expect(parsed.choices).toHaveLength(1);
        expect(parsed.choices[0].finish_reason).toEqual("stop");
        expect(parsed.choices[0].message).toEqual({ role: "assistant", content: "Hi there.", name: "greeter" });
        expect(parsed.response).toEqual("Hi there.");
        expect(parsed.usage).toEqual({ prompt_tokens: 11, completion_tokens: 3, total_tokens: 14 });

        expect(requests[0].messages.map((message) => message.role)).toEqual(["system", "system", "human"]);
    });

    it("translates a multimodal prompt into content blocks", async () => {
        const { run, requests } = scriptedModel([generation([{ type: "text", text: "A cat." }])]);
        await ask.run(context(), "describer", "", run, "", undefined, undefined, {
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "what is this?" },
                        { type: "image_url", image_url: { url: "https://example.com/a.png" } },
                    ],
                },
            ],
        });

        expect(requests[0].messages.at(-1)?.content).toEqual([
            { type: "text", text: "what is this?" },
            { type: "image", url: "https://example.com/a.png" },
        ]);
    });

    it("translates the tool calls and results of a prompt into blocks", async () => {
        const { run, requests } = scriptedModel([
            generation([{ type: "tool_call", id: "call-1", name: "tool_1", args: { order: "A-1" } }]),
            generation([{ type: "text", text: "Order A-1 has shipped." }]),
        ]);
        const lookup = (async () => ({ status: "shipped" })) as unknown as SubFlow;
        const response = await ask.run(
            context(),
            "support",
            "",
            run,
            "and A-1?",
            [lookup],
            undefined,
            {
                messages: [
                { role: "user", content: "where is A-0?" },
                {
                    role: "assistant",
                    content: null,
                    tool_calls: [
                        { id: "call-0", type: "function", function: { name: "tool_1", arguments: '{"order":"A-0"}' } },
                    ],
                },
                    { role: "tool", tool_call_id: "call-0", content: '{"status":"delivered"}' },
                ],
            },
        );

        const asked = requests[0].messages.find((message) => message.role === "ai");
        expect(asked?.content).toEqual([{ type: "tool_call", id: "call-0", name: "tool_1", args: { order: "A-0" } }]);
        const result = requests[0].messages.find((message) => message.role === "tool");
        expect(result?.tool_call_id).toEqual("call-0");

        const parsed = AiChatResponseSchema.parse(response);
        expect(parsed.choices[0].finish_reason).toEqual("stop");
        expect(parsed.choices[0].message.content).toEqual("Order A-1 has shipped.");
    });

    it("keeps a malformed tool call instead of failing the request", async () => {
        const { run, requests } = scriptedModel([generation([{ type: "text", text: "ok" }])]);
        await ask.run(context(), "support", "", run, "again?", undefined, undefined, {
            messages: [
                {
                    role: "assistant",
                    content: null,
                    tool_calls: [
                        { id: "call-0", type: "function", function: { name: "tool_1", arguments: "{broken" } },
                    ],
                },
            ],
        });

        const asked = requests[0].messages.find((message) => message.role === "ai");
        expect(asked?.content[0]).toMatchObject({ type: "invalid_tool_call", id: "call-0", args: "{broken" });
    });

    it("does not carry a reasoning block out, because the format has no field for it", async () => {
        const { run } = scriptedModel([
            generation([
                { type: "reasoning", reasoning: "the user greeted me" },
                { type: "text", text: "Hi." },
            ]),
        ]);
        const response = await ask.run(context(), "greeter", "", run, "hello");

        expect(response.choices[0].message.content).toEqual("Hi.");
    });

    it("takes just a prompt, with no request at all", async () => {
        const { run, requests } = scriptedModel([generation([{ type: "text", text: "Hi." }])]);
        const response = await ask.run(context(), "greeter", "", run, "hello");

        expect(requests[0].messages.at(-1)?.content).toEqual([{ type: "text", text: "hello" }]);
        expect(response.choices[0].message.content).toEqual("Hi.");
    });

    it("appends the prompt to the conversation the request carries", async () => {
        const { run, requests } = scriptedModel([generation([{ type: "text", text: "Still fine." }])]);
        await ask.run(context(), "greeter", "", run, "and now?", undefined, undefined, {
            messages: [
                { role: "user", content: "how are you?" },
                { role: "assistant", content: "fine" },
            ],
        });

        expect(requests[0].messages.map((message) => message.role)).toEqual(["human", "ai", "human"]);
        expect(requests[0].messages.at(-1)?.content).toEqual([{ type: "text", text: "and now?" }]);
    });

    it("carries the answer as plain text next to the OpenAI shape", async () => {
        const { run } = scriptedModel([generation([{ type: "text", text: "Two parts. " }, { type: "text", text: "One answer." }])]);

        const response = await ask.run(context(), "greeter", "", run, "hello");

        expect(response.response).toEqual("Two parts. One answer.");
        expect(response.object).toEqual("chat.completion");
    });

    it("leaves the plain text empty when the model only asked for a tool", async () => {
        const { run } = scriptedModel([
            generation([{ type: "tool_call", id: "call-1", name: "tool_1", args: {} }]),
            generation([{ type: "text", text: "done" }]),
        ]);
        const lookup = (async () => ({ ok: true })) as unknown as SubFlow;

        const response = await ask.run(context(), "support", "", run, "hi", [lookup]);

        // The run ends on a text answer, so this one is filled; the tool-call-only
        // turn in between is what an empty `response` would come from.
        expect(response.response).toEqual("done");
    });

    it("rejects having nothing to ask", async () => {
        const { run } = scriptedModel([generation([{ type: "text", text: "ok" }])]);

        await expect(ask.run(context(), "greeter", "", run, "")).rejects.toThrow(/nothing to ask/);
        await expect(
            ask.run(context(), "greeter", "", run, "", undefined, undefined, { messages: [] }),
        ).rejects.toThrow(/nothing to ask/);
        await expect(
            ask.run(context(), "greeter", "", run, "hi", undefined, undefined, {
                messages: "nope",
            } as never),
        ).rejects.toThrow(/not valid/);
    });
});

/**
 * What every model node has to get right, whichever provider it calls.
 *
 * The flow side of a model is the same everywhere - a request in, one message back -
 * so what is worth testing per provider is the narrow part each one differs in: the
 * dialect its output type is written in, and whether it claims to serve one at all.
 */
describe("the model nodes", () => {
    const anthropic = new AnthropicModelFunction();
    const groq = new GroqModelFunction();
    const mistral = new MistralModelFunction();
    const ollama = new OllamaModelFunction();
    const openai = new OpenAiModelFunction();

    const request = {
        messages: [{ role: "human", content: [{ type: "text", text: "hi" }] }],
        tools: [],
        response_format: { name: "extract", schema: { type: "object", properties: {} } },
    };

    /** The names of the fields the node declares it takes a request with. */
    const fields = (schema: unknown): string[] =>
        Object.keys((toJsonSchema(schema as never) as { properties?: object }).properties ?? {});

    it("names its sub flow after the provider and the model", () => {
        expect(openai.run(context(), "gpt-5", "sk-test").name).toEqual("openai:gpt-5");
        expect(anthropic.run(context(), "claude-opus-5", "sk-ant-test").name).toEqual("anthropic:claude-opus-5");
        expect(groq.run(context(), "llama-3.3-70b-versatile", "gsk-test").name).toEqual(
            "groq:llama-3.3-70b-versatile",
        );
        expect(mistral.run(context(), "mistral-large-latest", "test").name).toEqual("mistral:mistral-large-latest");
        expect(ollama.run(context(), "qwen3:8b").name).toEqual("ollama:qwen3:8b");
    });

    it("needs a model identifier, and a key wherever the provider has one", () => {
        expect(() => openai.run(context(), "", "sk-test")).toThrow(RuntimeError);
        expect(() => openai.run(context(), "gpt-5", "")).toThrow(RuntimeError);
        expect(() => anthropic.run(context(), "claude-opus-5", "")).toThrow(RuntimeError);
        expect(() => groq.run(context(), "llama-3.3-70b-versatile", "")).toThrow(RuntimeError);
        expect(() => mistral.run(context(), "mistral-large-latest", "")).toThrow(RuntimeError);
        // Ollama is a server of your own, so there is no key to be missing.
        expect(() => ollama.run(context(), "")).toThrow(RuntimeError);
        expect(ollama.run(context(), "qwen3:8b").inputSchema).toBeDefined();
    });

    it("declares an output type only where the provider can constrain the answer", () => {
        expect(fields(openai.run(context(), "gpt-5", "sk-test").inputSchema)).toContain("response_format");
        expect(fields(anthropic.run(context(), "claude-opus-5", "sk-ant-test").inputSchema)).toContain(
            "response_format",
        );
        expect(fields(ollama.run(context(), "qwen3:8b").inputSchema)).toContain("response_format");

        // Mistral's client takes a JSON mode but no schema, so this node cannot
        // promise a constrained answer - and the agent reads that off the schema and
        // asks for the type as a forced tool call instead.
        expect(fields(mistral.run(context(), "mistral-large-latest", "test").inputSchema)).not.toContain(
            "response_format",
        );
        expect(fields(groq.run(context(), "openai/gpt-oss-120b", "gsk-test").inputSchema)).toContain(
            "response_format",
        );
    });

    it("writes the asked-for output type in the provider's own dialect", async () => {
        const answer = new AIMessage("ok");
        const openAiInvoke = vi.spyOn(ChatOpenAI.prototype, "invoke").mockResolvedValue(answer as never);
        const anthropicInvoke = vi.spyOn(ChatAnthropic.prototype, "invoke").mockResolvedValue(answer as never);
        const groqInvoke = vi.spyOn(ChatGroq.prototype, "invoke").mockResolvedValue(answer as never);
        const ollamaInvoke = vi.spyOn(ChatOllama.prototype, "invoke").mockResolvedValue(answer as never);

        await openai.run(context(), "gpt-5", "sk-test").run(request as never);
        await anthropic.run(context(), "claude-opus-5", "sk-ant-test").run(request as never);
        await groq.run(context(), "openai/gpt-oss-120b", "gsk-test").run(request as never);
        await ollama.run(context(), "qwen3:8b").run(request as never);

        expect(openAiInvoke.mock.calls[0]?.[1]).toMatchObject({ response_format: { type: "json_schema" } });
        expect(groqInvoke.mock.calls[0]?.[1]).toMatchObject({ response_format: { type: "json_schema" } });
        expect(anthropicInvoke.mock.calls[0]?.[1]).toMatchObject({
            outputConfig: { format: { type: "json_schema", schema: request.response_format.schema } },
        });
        expect(ollamaInvoke.mock.calls[0]?.[1]).toMatchObject({ format: request.response_format.schema });

        vi.restoreAllMocks();
    });

    it("hands the provider's own web search to the model only when it is switched on", async () => {
        const answer = new AIMessage("ok");
        const bindTools = vi
            .spyOn(ChatAnthropic.prototype, "bindTools")
            .mockReturnValue({ invoke: async () => answer } as never);
        vi.spyOn(ChatAnthropic.prototype, "invoke").mockResolvedValue(answer as never);

        await anthropic.run(context(), "claude-opus-5", "sk-ant-test").run(request as never);
        expect(bindTools).not.toHaveBeenCalled();

        await anthropic
            .run(context(), "claude-opus-5", "sk-ant-test", undefined, undefined, true)
            .run(request as never);
        expect(bindTools).toHaveBeenCalledWith([{ type: "web_search_20250305", name: "web_search" }]);

        vi.restoreAllMocks();
    });

    it("calls an OpenAI-compatible service where it was pointed instead of OpenAI", () => {
        const transform = openai.run(context(), "qwen3-32b", "sk-test", "http://localhost:8000/v1");

        expect(transform.name).toEqual("openai:qwen3-32b");
        expect(fields(transform.inputSchema)).toContain("response_format");
    });

    it("is accepted by ai::agent::ask as the agent's model", async () => {
        const answer = new AIMessage("ok");
        vi.spyOn(ChatAnthropic.prototype, "invoke").mockResolvedValue(answer as never);

        const response = await ask.run(
            context(),
            "support",
            "You are helpful.",
            asFlowValue(anthropic.run(context(), "claude-opus-5", "sk-ant-test")),
            "hi",
        );
        expect(response.choices[0]?.message.content).toContain("ok");

        vi.restoreAllMocks();
    });
});
