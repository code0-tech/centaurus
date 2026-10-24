import "reflect-metadata";
import { RuntimeError, type FunctionContext, type SubFlow } from "@code0-tech/hercules";
import { describe, expect, it } from "vitest";
import type { AiContentBlock } from "../src/message/datatypes/Message.contentBlock.datatype.js";
import type { AiMessage } from "../src/message/datatypes/Message.datatype.js";
import { AiChatResponseSchema } from "../src/chat/datatypes/Chat.response.datatype.js";
import type { AiModelRequest } from "../src/model/datatypes/Model.request.datatype.js";
import { AiModelResponseSchema, type AiModelResponse } from "../src/model/datatypes/Model.response.datatype.js";
import { AiStateUpdateSchema } from "../src/middleware/datatypes/Middleware.stateUpdate.datatype.js";
import { AiWebSearchResultSchema } from "../src/websearch/datatypes/WebSearch.result.datatype.js";
import { TrimMessagesMiddlewareFunction } from "../src/middleware/runtimefunctions/Middleware.trimMessages.runtimefunction.js";
import { OpenRouterModelFunction } from "../src/model/runtimefunctions/Model.openRouter.runtimefunction.js";
import { WebSearchToolFunction } from "../src/websearch/runtimefunctions/WebSearch.search.runtimefunction.js";
import { CreateAgentFunction } from "../src/agent/runtimefunctions/Agent.create.runtimefunction.js";
import { InvokeAgentFunction } from "../src/agent/runtimefunctions/Agent.invoke.runtimefunction.js";

const model = new OpenRouterModelFunction();
const middleware = new TrimMessagesMiddlewareFunction();
const search = new WebSearchToolFunction();
const create = new CreateAgentFunction();

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
    it("returns a callable, which is what TRANSFORM<_, _> is", () => {
        const transform = model.run(context(), "anthropic/claude-opus-5", "sk-or-test");
        expect(typeof transform).toEqual("function");
    });

    it("needs a model identifier and an API key", () => {
        expect(() => model.run(context(), "", "key")).toThrow(RuntimeError);
        expect(() => model.run(context(), "anthropic/claude-opus-5", "")).toThrow(RuntimeError);
    });

    it("rejects a call whose argument is not a model request", async () => {
        const transform = model.run(context(), "anthropic/claude-opus-5", "sk-or-test");
        await expect(transform({ messages: [] } as never)).rejects.toThrow(/model request is not valid/);
    });

    it("reports a failed call as a runtime error rather than leaking the provider's", async () => {
        const transform = model.run(context(), "anthropic/claude-opus-5", "sk-or-invalid-key-for-test");
        await expect(
            transform({ messages: [{ role: "human", content: [{ type: "text", text: "hi" }] }], tools: [] } as never),
        ).rejects.toThrow(RuntimeError);
    }, 30_000);

    it("is accepted by ai::agent::create as the agent's model", () => {
        const transform = model.run(context(), "anthropic/claude-opus-5", "sk-or-test");
        const agent = create.run(context(), "support", "You are helpful.", transform);
        expect(typeof agent).toEqual("function");
    });
});

describe("ai::middleware::trim_messages", () => {
    it("returns a callable, which is what TRANSFORM<_, _> is", () => {
        const transform = middleware.run(context(), 200);
        expect(typeof transform).toEqual("function");
    });

    it("rejects a budget that is not a positive number", () => {
        expect(() => middleware.run(context(), 0)).toThrow(RuntimeError);
        expect(() => middleware.run(context(), Number.NaN)).toThrow(RuntimeError);
    });

    it("rejects a strategy it has no meaning for", () => {
        expect(() => middleware.run(context(), 500, "middle")).toThrow(/not a trim strategy/);
    });

    it("returns no change when the conversation already fits", async () => {
        const update = await middleware.run(context(), 100_000)(state(1));
        expect(update).toEqual({});
    });

    it("drops whole messages until the conversation fits the budget", async () => {
        const before = state(12);
        const update = await middleware.run(context(), 200)(before);

        const parsed = AiStateUpdateSchema.parse(update);
        expect(parsed.messages).toBeDefined();
        expect(parsed.messages!.length).toBeLessThan(before.messages.length);
        expect(parsed.messages!.at(-1)?.content).toEqual(before.messages.at(-1)?.content);
    });

    it("keeps the system prompt when it trims", async () => {
        const update = await middleware.run(context(), 200, "last", true)(state(12));
        const parsed = AiStateUpdateSchema.parse(update);
        expect(parsed.messages![0].role).toEqual("system");
    });

    it("rejects a state that is not an agent state", async () => {
        const transform = middleware.run(context(), 500);
        await expect(transform({ messages: [] } as never)).rejects.toThrow(/agent state is not valid/);
    });

    it("produces an update the agent will accept", async () => {
        const update = await middleware.run(context(), 200)(state(12));
        expect(() => AiStateUpdateSchema.parse(update)).not.toThrow();
    });
});

describe("ai::tool::web_search", () => {
    it("needs a query and an API key", async () => {
        await expect(search.run(context(), "", "key")).rejects.toThrow(RuntimeError);
        await expect(search.run(context(), "   ", "key")).rejects.toThrow(RuntimeError);
        await expect(search.run(context(), "what is langchain", "")).rejects.toThrow(RuntimeError);
    });

    it("reports a failed search as a runtime error", async () => {
        await expect(search.run(context(), "what is langchain", "tvly-invalid-key-for-test")).rejects.toThrow(
            RuntimeError,
        );
    }, 30_000);
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

    it("the search function's output is a valid AI_WEB_SEARCH_RESULT", () => {
        expect(() =>
            AiWebSearchResultSchema.parse({
                query: "what is langchain",
                results: [{ title: "LangChain", url: "https://x", content: "a framework", score: 0.9 }],
                answer: "A framework for LLM applications.",
            }),
        ).not.toThrow();
    });
});

describe("ai::agent::invoke", () => {
    const invoke = new InvokeAgentFunction();

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
        const agent = create.run(context(), "greeter", "You greet people.", run);

        const response = await invoke.run(context(), agent, "hello", {
            model: "my-agent",
            messages: [{ role: "system", content: "Be brief." }],
        });

        const parsed = AiChatResponseSchema.parse(response);
        expect(parsed.object).toEqual("chat.completion");
        expect(parsed.model).toEqual("anthropic/claude-opus-5");
        expect(parsed.choices).toHaveLength(1);
        expect(parsed.choices[0].finish_reason).toEqual("stop");
        expect(parsed.choices[0].message).toEqual({ role: "assistant", content: "Hi there.", name: "greeter" });
        expect(parsed.usage).toEqual({ prompt_tokens: 11, completion_tokens: 3, total_tokens: 14 });

        expect(requests[0].messages.map((message) => message.role)).toEqual(["system", "system", "human"]);
    });

    it("translates a multimodal prompt into content blocks", async () => {
        const { run, requests } = scriptedModel([generation([{ type: "text", text: "A cat." }])]);
        const agent = create.run(context(), "describer", "", run);

        await invoke.run(context(), agent, "", {
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
        const agent = create.run(context(), "support", "", run, [lookup]);

        const response = await invoke.run(context(), agent, "and A-1?", {
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
        });

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
        const agent = create.run(context(), "support", "", run);

        await invoke.run(context(), agent, "again?", {
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
        const agent = create.run(context(), "greeter", "", run);

        const response = await invoke.run(context(), agent, "hello");

        expect(response.choices[0].message.content).toEqual("Hi.");
    });

    it("takes just a prompt, with no request at all", async () => {
        const { run, requests } = scriptedModel([generation([{ type: "text", text: "Hi." }])]);
        const agent = create.run(context(), "greeter", "", run);

        const response = await invoke.run(context(), agent, "hello");

        expect(requests[0].messages.at(-1)?.content).toEqual([{ type: "text", text: "hello" }]);
        expect(response.choices[0].message.content).toEqual("Hi.");
    });

    it("appends the prompt to the conversation the request carries", async () => {
        const { run, requests } = scriptedModel([generation([{ type: "text", text: "Still fine." }])]);
        const agent = create.run(context(), "greeter", "", run);

        await invoke.run(context(), agent, "and now?", {
            messages: [
                { role: "user", content: "how are you?" },
                { role: "assistant", content: "fine" },
            ],
        });

        expect(requests[0].messages.map((message) => message.role)).toEqual(["human", "ai", "human"]);
        expect(requests[0].messages.at(-1)?.content).toEqual([{ type: "text", text: "and now?" }]);
    });

    it("rejects anything that is not an agent", async () => {
        await expect(invoke.run(context(), { id: "agent-1" } as never, "hello")).rejects.toThrow(/has to be an agent/);
    });

    it("rejects having nothing to ask", async () => {
        const { run } = scriptedModel([generation([{ type: "text", text: "ok" }])]);
        const agent = create.run(context(), "greeter", "", run);

        await expect(invoke.run(context(), agent, "")).rejects.toThrow(/nothing to ask/);
        await expect(invoke.run(context(), agent, "", { messages: [] })).rejects.toThrow(/nothing to ask/);
        await expect(invoke.run(context(), agent, "hi", { messages: "nope" } as never)).rejects.toThrow(/not valid/);
    });
});
