import "reflect-metadata";
import { RuntimeError, type FunctionContext, type SubFlow } from "@code0-tech/hercules";
import { describe, expect, it } from "vitest";
import type { AiAgentState } from "../src/middleware/datatypes/Middleware.agentState.datatype.js";
import type { AiMessage } from "../src/message/datatypes/Message.datatype.js";
import type { AiModelRequest } from "../src/model/datatypes/Model.request.datatype.js";
import type { AiModelResponse } from "../src/model/datatypes/Model.response.datatype.js";
import { CreateAgentFunction } from "../src/agent/runtimefunctions/Agent.create.runtimefunction.js";
import { TrimMessagesMiddlewareFunction } from "../src/middleware/runtimefunctions/Middleware.trimMessages.runtimefunction.js";

function subFlow(implementation: (input: never) => unknown, inputSchema?: Record<string, unknown>): SubFlow {
    const flow = (async (input: never) => implementation(input)) as unknown as {
        inputSchema?: unknown;
        outputSchema?: unknown;
    };
    if (inputSchema) flow.inputSchema = inputSchema;
    return flow as unknown as SubFlow;
}

function context(executionId = "execution-1"): FunctionContext {
    return {
        projectId: 1,
        executionId,
        matchedConfig: { projectId: 1, configValues: [], findConfig: () => undefined },
        executeFlow: async () => null,
    };
}

function answer(text: string, toolCalls: { id: string; name: string; args: object }[] = []): AiModelResponse {
    return {
        message: {
            role: "ai",
            content: [
                ...(text.length > 0 ? [{ type: "text", text }] : []),
                ...toolCalls.map((call) => ({ type: "tool_call", ...call })),
            ],
        },
    };
}

function scriptedModel(responses: AiModelResponse[]) {
    const requests: AiModelRequest[] = [];
    let call = 0;
    const run = subFlow((input: never) => {
        requests.push(input as unknown as AiModelRequest);
        return responses[Math.min(call++, responses.length - 1)];
    });
    return { run, requests };
}

const create = new CreateAgentFunction();

function user(text: string): AiMessage {
    return { role: "human", content: [{ type: "text", text }] };
}

function assistant(text: string): AiMessage {
    return { role: "ai", content: [{ type: "text", text }] };
}

function textOf(message: AiMessage | undefined): string {
    return (message?.content ?? [])
        .filter((block) => block.type === "text")
        .map((block) => String(block.text ?? ""))
        .join("");
}

describe("ai::agent::create", () => {
    it("returns the agent itself, which is a callable", () => {
        const { run } = scriptedModel([answer("hello")]);
        const agent = create.run(context(), "greeter", "You greet people.", run);

        expect(typeof agent).toEqual("function");
    });

    it("needs a name", () => {
        const { run } = scriptedModel([answer("hello")]);
        expect(() => create.run(context(), "", "", run)).toThrow(RuntimeError);
    });

    it("rejects a model that is not a sub flow", () => {
        expect(() =>
            create.run(context(), "greeter", "", { provider: "anthropic", model: "claude-opus-5" } as never),
        ).toThrow(RuntimeError);
    });

    it("rejects an MCP server missing what its transport needs, while the flow is built", () => {
        const { run } = scriptedModel([answer("hello")]);
        expect(() =>
            create.run(context(), "greeter", "", run, [{ name: "docs", transport: "stdio" }] as never),
        ).toThrow(RuntimeError);
    });

    it("rejects two MCP servers with the same name", () => {
        const { run } = scriptedModel([answer("hello")]);
        expect(() =>
            create.run(context(), "greeter", "", run, [
                { name: "docs", url: "https://a/mcp" },
                { name: "docs", url: "https://b/mcp" },
            ] as never),
        ).toThrow(RuntimeError);
    });
});

describe("the agent loop", () => {
    it("runs the model sub flow and returns its answer", async () => {
        const { run, requests } = scriptedModel([answer("Hi there.")]);
        const agent = create.run(context(), "greeter", "You greet people.", run);

        const result = await agent({ messages: [user("hello")] });

        expect(requests).toHaveLength(1);
        expect(requests[0].messages.map((m) => m.role)).toEqual(["system", "human"]);
        expect(requests[0].messages[0].content).toEqual([{ type: "text", text: "You greet people." }]);
        expect(textOf(result.messages.at(-1))).toEqual("Hi there.");
    });

    it("advertises every tool sub flow to the model and calls the one it picks", async () => {
        const { run, requests } = scriptedModel([
            answer("", [{ id: "call-1", name: "tool_1", args: { order: "A-1" } }]),
            answer("Order A-1 has shipped."),
        ]);
        const calls: unknown[] = [];
        const lookup = subFlow(
            (input: never) => {
                calls.push(input);
                return { status: "shipped" };
            },
            { type: "object", description: "Looks an order up.", properties: { order: { type: "string" } } },
        );

        const agent = create.run(context(), "support", "", run, [lookup]);
        const result = await agent({ messages: [user("where is A-1?")] });

        expect(requests[0].tools).toEqual([
            {
                name: "tool_1",
                description: "Looks an order up.",
                input_schema: expect.objectContaining({ type: "object" }),
            },
        ]);
        expect(calls).toEqual([{ order: "A-1" }]);
        expect(requests[1].messages.map((m) => m.role)).toEqual(["human", "ai", "tool"]);
        expect(requests[1].messages.at(-1)?.content).toEqual([{ type: "text", text: '{"status":"shipped"}' }]);
        expect(textOf(result.messages.at(-1))).toEqual("Order A-1 has shipped.");
    });

    it("reports a failing tool to the model instead of aborting the run", async () => {
        const { run, requests } = scriptedModel([
            answer("", [{ id: "call-1", name: "tool_1", args: {} }]),
            answer("That did not work."),
        ]);
        const broken = subFlow(() => {
            throw new Error("the warehouse is offline");
        });

        const agent = create.run(context(), "support", "", run, [broken]);
        const result = await agent({ messages: [user("status?")] });

        expect(JSON.stringify(requests[1].messages.at(-1)?.content)).toContain("the warehouse is offline");
        expect(textOf(result.messages.at(-1))).toEqual("That did not work.");
    });

    it("lets a middleware sub flow rewrite the conversation before the model call", async () => {
        const { run, requests } = scriptedModel([answer("ok")]);
        const redact = subFlow((input: never) => {
            const state = input as unknown as {
                hook: string;
                messages: { role: string; content: { type: string; text?: string }[] }[];
            };
            if (state.hook !== "before_model") return null;
            return {
                messages: state.messages.map((message) => ({
                    ...message,
                    content: message.content.map((block) =>
                        block.type === "text" ? { ...block, text: block.text?.replace(/\d{4,}/g, "****") } : block,
                    ),
                })),
            };
        });

        const agent = create.run(context(), "support", "", run, [], [redact]);
        await agent({ messages: [user("my card is 4111111111111111")] });

        expect(requests[0].messages.at(-1)?.content).toEqual([{ type: "text", text: "my card is ****" }]);
    });

    it("lets a middleware sub flow end the run before the model is called", async () => {
        const { run, requests } = scriptedModel([answer("should not be reached")]);
        const block = subFlow(() => ({ jump_to: "end" }));

        const agent = create.run(context(), "support", "", run, [], [block]);
        await agent({ messages: [user("hello")] });

        expect(requests).toHaveLength(0);
    });

    it("calls one middleware sub flow for both the before and the after phase", async () => {
        const { run } = scriptedModel([answer("ok")]);
        const hooks: string[] = [];
        const observe = subFlow((input: never) => {
            hooks.push((input as unknown as { hook: string }).hook);
            return null;
        });

        const agent = create.run(context(), "support", "", run, [], [observe]);
        const result = await agent({ messages: [user("hello")] });

        expect(hooks).toEqual(["before_model", "after_model"]);
        expect(textOf(result.messages.at(-1))).toEqual("ok");
    });

    it("takes sub flow tools and MCP servers in the same list", async () => {
        const { run, requests } = scriptedModel([answer("ok")]);
        const lookup = subFlow(() => ({ status: "shipped" }), { type: "object", description: "Looks an order up." });

        expect(() =>
            create.run(context(), "support", "", run, [lookup, { name: "docs", transport: "stdio" }] as never),
        ).toThrow(/needs a command/);

        const agent = create.run(context(), "support", "", run, [lookup]);
        await agent({ messages: [user("hello")] });
        expect(requests[0].tools.map((t) => t.name)).toEqual(["tool_1"]);
    });

    it("rejects a tool entry that is neither a sub flow nor an MCP server", async () => {
        const { run } = scriptedModel([answer("ok")]);
        expect(() => create.run(context(), "support", "", run, [{ nonsense: true }] as never)).toThrow(
            /Entry 1 of "tools"/,
        );
    });

    it("fails with a clear error when the model sub flow answers with the wrong shape", async () => {
        const run = subFlow(() => ({ message: { role: "ai", content: "not a list" } }));
        const agent = create.run(context(), "greeter", "", run);

        await expect(agent({ messages: [user("hello")] })).rejects.toThrow(/did not return a valid model response/);
    });
});

describe("what a middleware flow is handed", () => {
    it("forwards the run's thread, not just the messages", async () => {
        const seen: AiAgentState[] = [];
        const { run } = scriptedModel([answer("ok")]);
        const observe = subFlow((input: never) => {
            seen.push(input as unknown as AiAgentState);
            return {};
        });

        const agent = create.run(context(), "support", "You are helpful.", run, [], [observe]);
        await agent({ messages: [user("hello")], thread_id: "thread-1" });

        expect(seen[0].thread_id).toEqual("thread-1");
        expect(seen[0].context).toBeUndefined();
        expect(Object.keys(seen[0])).toEqual(["messages", "agent_name", "hook", "thread_id"]);
    });
});

describe("composing the shipped functions into an agent", () => {
    it("uses ai::middleware::trim_messages as a real middleware", async () => {
        const trim = new TrimMessagesMiddlewareFunction();
        const middlewareFlow = trim.run(context(), 200, "last", true);

        const { run, requests } = scriptedModel([answer("ok")]);
        const long = Array.from({ length: 12 }, (_, turn) =>
            turn % 2 === 0
                ? user(`question ${turn} ${"padding ".repeat(40)}`)
                : assistant(`answer ${turn} ${"padding ".repeat(40)}`),
        );

        const agent = create.run(context(), "support", "You are helpful.", run, [], [middlewareFlow]);
        const result = await agent({ messages: long });

        expect(requests).toHaveLength(1);
        expect(requests[0].messages.length).toBeLessThan(long.length + 1);
        expect(requests[0].messages[0].role).toEqual("system");
        expect(textOf(result.messages.at(-1))).toEqual("ok");
    });
});
