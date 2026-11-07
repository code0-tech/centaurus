import "reflect-metadata";
import { RuntimeError, type FunctionContext, type SubFlow } from "@code0-tech/hercules";
import { describe, expect, it } from "vitest";
import type { AiAgentState } from "../src/datatypes/middleware/Middleware.agentState.datatype.js";
import type { AiMessage } from "../src/datatypes/message/Message.datatype.js";
import type { AiModelRequest } from "../src/datatypes/model/Model.request.datatype.js";
import type { AiModelResponse } from "../src/datatypes/model/Model.response.datatype.js";
import { CreateAgentFunction } from "../src/runtimefunctions/agent/Agent.create.runtimefunction.js";
import { TrimMessagesMiddlewareFunction } from "../src/runtimefunctions/middleware/Middleware.trimMessages.runtimefunction.js";

function subFlow(implementation: (input: never) => unknown, inputSchema?: Record<string, unknown>): SubFlow {
    const flow = (async (input: never) => implementation(input)) as unknown as {
        inputSchema?: unknown;
        outputSchema?: unknown;
    };
    if (inputSchema) flow.inputSchema = inputSchema;
    return flow as unknown as SubFlow;
}

/**
 * Mirrors how hercules hands a sub flow function to a consuming node: the producing
 * node returns a definition, the node that receives it gets a callable sub flow.
 */
function asFlowValue<R>(definition: { run: (...args: never[]) => R | Promise<R> }): (...args: unknown[]) => Promise<R> {
    const call = definition.run.bind(definition) as unknown as (...args: unknown[]) => R | Promise<R>;
    return (...args: unknown[]) => Promise.resolve(call(...args));
}

/** The assistant text of a chat response, which is what the node answers with. */
function replyOf(response: { choices: { message: { content?: unknown } }[] }): string {
    return String(response.choices[0]?.message.content ?? "");
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

function scriptedModel(responses: AiModelResponse[], inputSchema?: Record<string, unknown>) {
    const requests: AiModelRequest[] = [];
    let call = 0;
    const run = subFlow((input: never) => {
        requests.push(input as unknown as AiModelRequest);
        return responses[Math.min(call++, responses.length - 1)];
    }, inputSchema);
    return { run, requests };
}

/**
 * The input schema of a model node that can constrain its own output, which is how
 * such a node tells the agent to ask the provider for the type directly instead of
 * binding it as a tool the model has to call.
 */
const nativeModelSchema: Record<string, unknown> = {
    type: "object",
    properties: { messages: {}, tools: {}, response_format: {} },
};

const create = new CreateAgentFunction();

/** A data type's JSON schema, which is what a `TYPE` parameter carries. */
const orderType: Record<string, unknown> = {
    title: "Order",
    type: "object",
    properties: { order: { type: "string" }, status: { type: "string" } },
    required: ["order", "status"],
};

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

/** Wraps a plain schema the way aquila sends a sub flow's input schema: a shared.Struct. */
function asStruct(plain: Record<string, unknown>): unknown {
    const asValue = (value: unknown): unknown => {
        if (typeof value === "string") return { kind: { oneofKind: "stringValue", stringValue: value } };
        if (typeof value === "boolean") return { kind: { oneofKind: "boolValue", boolValue: value } };
        if (typeof value === "number")
            return {
                kind: {
                    oneofKind: "numberValue",
                    numberValue: { number: { oneofKind: "integer", integer: BigInt(value) } },
                },
            };
        if (Array.isArray(value)) return { kind: { oneofKind: "listValue", listValue: { values: value.map(asValue) } } };
        if (value && typeof value === "object")
            return { kind: { oneofKind: "structValue", structValue: asStruct(value as Record<string, unknown>) } };
        return { kind: { oneofKind: "nullValue", nullValue: 0 } };
    };

    return { fields: Object.fromEntries(Object.entries(plain).map(([key, value]) => [key, asValue(value)])) };
}

describe("ai::agent::create", () => {
    it("answers with a chat response, because it runs the agent itself", async () => {
        const { run } = scriptedModel([answer("hello")]);
        const response = await create.run(context(), "greeter", "You greet people.", run, "hi");

        expect(response.object).toEqual("chat.completion");
        expect(replyOf(response)).toEqual("hello");
    });

    it("answers in the type it was given, next to the chat response", async () => {
        const { run, requests } = scriptedModel([
            answer("", [{ id: "call-1", name: "Order", args: { order: "A-1", status: "shipped" } }]),
        ]);

        const response = await create.run(context(), "support", "", run, "where is A-1?", undefined, orderType);

        // The type travels to the model as the tool it has to call to answer.
        expect(requests[0].tools.map((tool) => tool.name)).toEqual(["Order"]);
        expect(response.structured_response).toEqual({ order: "A-1", status: "shipped" });
    });

    it("forces the tool call that carries the type, because an offered tool is one the model may skip", async () => {
        const { run, requests } = scriptedModel([
            answer("", [{ id: "call-1", name: "Order", args: { order: "A-1", status: "shipped" } }]),
        ]);

        await create.run(context(), "support", "", run, "where is A-1?", undefined, orderType);

        expect(requests[0].tool_choice).toBe("any");
    });

    it("leaves the tool choice alone when no type was asked for", async () => {
        const { run, requests } = scriptedModel([answer("hello")]);
        await create.run(context(), "greeter", "", run, "hi");

        expect(requests[0].tool_choice).toBeUndefined();
    });

    it("asks a model that can constrain its own output for the type directly", async () => {
        const { run, requests } = scriptedModel(
            [answer(JSON.stringify({ order: "A-3", status: "packed" }))],
            nativeModelSchema,
        );

        const response = await create.run(context(), "support", "", run, "where is A-3?", undefined, orderType);

        // No tool to call and nothing to force: the type travels as the format the
        // answer has to be written in, and is read back off the message.
        expect(requests[0].tools).toEqual([]);
        expect(requests[0].tool_choice).toBeUndefined();
        expect(requests[0].response_format?.schema).toMatchObject({
            properties: { order: { type: "string" }, status: { type: "string" } },
        });
        expect(response.structured_response).toEqual({ order: "A-3", status: "packed" });
    });

    it("asks for the type in a turn of its own when the agent has tools, because a provider may refuse both at once", async () => {
        const { run, requests } = scriptedModel(
            [answer("I made you a user object."), answer(JSON.stringify({ order: "A-4", status: "open" }))],
            nativeModelSchema,
        );
        const flowTool = subFlow(() => "ok");

        const response = await create.run(context(), "support", "", run, "make one", [flowTool], orderType);

        // First the agent works, with its tools and no type in the request.
        expect(requests[0].tools.map((tool) => tool.name)).toEqual(["tool_1"]);
        expect(requests[0].response_format).toBeUndefined();
        expect(requests[0].tool_choice).toBeUndefined();

        // Then the type is asked for alone, with nothing bound beside it.
        expect(requests[1].tools).toEqual([]);
        expect(requests[1].response_format?.schema).toMatchObject({ properties: { order: { type: "string" } } });
        expect(response.structured_response).toEqual({ order: "A-4", status: "open" });
    });

    it("asks for the type as a tool call on its own when the model cannot constrain its output", async () => {
        const { run, requests } = scriptedModel([
            answer("I made you a user object."),
            answer("", [{ id: "call-1", name: "Order", args: { order: "A-6", status: "open" } }]),
        ]);

        const response = await create.run(context(), "support", "", run, "make one", [subFlow(() => "ok")], orderType);

        // The flow tool is bound for the work, and the extract tool alone for the
        // type - never the two together, which is what a provider refuses.
        expect(requests[0].tools.map((tool) => tool.name)).toEqual(["tool_1"]);
        expect(requests[1].tools.map((tool) => tool.name)).toEqual(["Order"]);
        expect(response.structured_response).toEqual({ order: "A-6", status: "open" });
    });

    it("keeps the agent's own answer as the reply, not the extraction turn's", async () => {
        const { run } = scriptedModel(
            [answer("I made you a user object."), answer(JSON.stringify({ order: "A-5", status: "open" }))],
            nativeModelSchema,
        );

        const response = await create.run(context(), "support", "", run, "make one", [subFlow(() => "ok")], orderType);

        expect(replyOf(response)).toEqual("I made you a user object.");
    });

    it("asks for no format when a model that could constrain its output was given no type", async () => {
        const { run, requests } = scriptedModel([answer("hello")], nativeModelSchema);
        await create.run(context(), "greeter", "", run, "hi");

        expect(requests[0].response_format).toBeUndefined();
    });

    it("takes the type as the struct aquila wraps it in", async () => {
        const { run, requests } = scriptedModel([
            answer("", [{ id: "call-1", name: "Order", args: { order: "A-2", status: "delivered" } }]),
        ]);

        const response = await create.run(
            context(),
            "support",
            "",
            run,
            "where is A-2?",
            undefined,
            asStruct(orderType),
        );

        expect(requests[0].tools.map((tool) => tool.name)).toEqual(["Order"]);
        expect(response.structured_response).toEqual({ order: "A-2", status: "delivered" });
    });

    it("leaves the structured answer out when no type was asked for", async () => {
        const { run } = scriptedModel([answer("hello")]);
        const response = await create.run(context(), "greeter", "", run, "hi");

        expect(response.structured_response).toBeUndefined();
    });

    it("rejects a type the agent cannot answer in", async () => {
        const { run } = scriptedModel([answer("hello")]);
        await expect(
            create.run(context(), "support", "", run, "hi", undefined, { type: "string" }),
        ).rejects.toThrow(/no properties/);
    });

    it("fails when the agent ignores the type it was asked to answer in", async () => {
        const { run } = scriptedModel([answer("just text")]);
        await expect(create.run(context(), "support", "", run, "hi", undefined, orderType)).rejects.toThrow(
            /did not answer in the type/,
        );
    });

    it("needs a name", async () => {
        const { run } = scriptedModel([answer("hello")]);
        await expect(create.run(context(), "", "", run, "hi")).rejects.toThrow(RuntimeError);
    });

    it("needs something to ask", async () => {
        const { run } = scriptedModel([answer("hello")]);
        await expect(create.run(context(), "greeter", "", run, "")).rejects.toThrow(/nothing to ask/);
    });

    it("rejects a model that is not a sub flow", async () => {
        await expect(
            create.run(context(), "greeter", "", { provider: "anthropic", model: "claude-opus-5" } as never, "hi"),
        ).rejects.toThrow(RuntimeError);
    });

    it("rejects an MCP server missing what its transport needs, before the agent runs", async () => {
        const { run } = scriptedModel([answer("hello")]);
        await expect(
            create.run(context(), "greeter", "", run, "hi", [{ name: "docs", transport: "stdio" }] as never),
        ).rejects.toThrow(RuntimeError);
    });

    it("rejects two MCP servers with the same name", async () => {
        const { run } = scriptedModel([answer("hello")]);
        await expect(
            create.run(context(), "greeter", "", run, "hi", [
                { name: "docs", url: "https://a/mcp" },
                { name: "docs", url: "https://b/mcp" },
            ] as never),
        ).rejects.toThrow(RuntimeError);
    });
});

describe("the agent loop", () => {
    it("runs the model sub flow and returns its answer", async () => {
        const { run, requests } = scriptedModel([answer("Hi there.")]);
        const response = await create.run(context(), "greeter", "You greet people.", run, "hello");

        expect(requests).toHaveLength(1);
        expect(requests[0].messages.map((m) => m.role)).toEqual(["system", "human"]);
        expect(requests[0].messages[0].content).toEqual([{ type: "text", text: "You greet people." }]);
        expect(replyOf(response)).toEqual("Hi there.");
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

        const response = await create.run(context(), "support", "", run, "where is A-1?", [lookup]);

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
        expect(replyOf(response)).toEqual("Order A-1 has shipped.");
    });

    it("reports a failing tool to the model instead of aborting the run", async () => {
        const { run, requests } = scriptedModel([
            answer("", [{ id: "call-1", name: "tool_1", args: {} }]),
            answer("That did not work."),
        ]);
        const broken = subFlow(() => {
            throw new Error("the warehouse is offline");
        });

        const response = await create.run(context(), "support", "", run, "status?", [broken]);

        expect(JSON.stringify(requests[1].messages.at(-1)?.content)).toContain("the warehouse is offline");
        expect(replyOf(response)).toEqual("That did not work.");
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

        await create.run(
            context(),
            "support",
            "",
            run,
            "my card is 4111111111111111",
            [],
            undefined,
            undefined,
            [redact],
        );

        expect(requests[0].messages.at(-1)?.content).toEqual([{ type: "text", text: "my card is ****" }]);
    });

    it("lets a middleware sub flow end the run before the model is called", async () => {
        const { run, requests } = scriptedModel([answer("should not be reached")]);
        const block = subFlow(() => ({ jump_to: "end" }));

        const response = await create.run(
            context(),
            "support",
            "",
            run,
            "hello",
            [],
            undefined,
            undefined,
            [block],
        );

        expect(requests).toHaveLength(0);
        // Nothing was generated, so the last message of the run is still the prompt.
        expect(response.choices[0].message).toEqual({ role: "user", content: "hello" });
    });

    it("calls one middleware sub flow for both the before and the after phase", async () => {
        const { run } = scriptedModel([answer("ok")]);
        const hooks: string[] = [];
        const observe = subFlow((input: never) => {
            hooks.push((input as unknown as { hook: string }).hook);
            return null;
        });

        const response = await create.run(
            context(),
            "support",
            "",
            run,
            "hello",
            [],
            undefined,
            undefined,
            [observe],
        );

        expect(hooks).toEqual(["before_model", "after_model"]);
        expect(replyOf(response)).toEqual("ok");
    });

    it("takes sub flow tools and MCP servers in the same list", async () => {
        const { run, requests } = scriptedModel([answer("ok")]);
        const lookup = subFlow(() => ({ status: "shipped" }), { type: "object", description: "Looks an order up." });

        await expect(
            create.run(context(), "support", "", run, "hello", [
                lookup,
                { name: "docs", transport: "stdio" },
            ] as never),
        ).rejects.toThrow(/needs a command/);

        await create.run(context(), "support", "", run, "hello", [lookup]);
        expect(requests[0].tools.map((t) => t.name)).toEqual(["tool_1"]);
    });

    it("names a tool after the sub flow and passes its schema on", async () => {
        const { run, requests } = scriptedModel([answer("ok")]);
        const now = subFlow(() => 1793919755965663, {
            $schema: "https://json-schema.org/draft/2020-12/schema",
            title: "Current time",
            description: "Answers with the current time in microseconds.",
            type: "object",
            properties: { timezone: { type: "string" } },
        });
        const nameless = subFlow(() => "nothing");

        await create.run(context(), "support", "", run, "hello", [now as never, nameless as never]);

        expect(requests[0].tools).toEqual([
            {
                name: "Current_time",
                description: "Answers with the current time in microseconds.",
                input_schema: {
                    $schema: "https://json-schema.org/draft/2020-12/schema",
                    title: "Current time",
                    description: "Answers with the current time in microseconds.",
                    type: "object",
                    properties: { timezone: { type: "string" } },
                },
            },
            { name: "tool_2", description: "", input_schema: { type: "object", properties: {} } },
        ]);
    });

    it("reads a name and description out of the raw struct aquila sends", async () => {
        const { run, requests } = scriptedModel([answer("ok")]);
        const lookup = subFlow(
            () => ({ status: "shipped" }),
            asStruct({ title: "Look up order", description: "Looks an order up.", type: "object" }) as never,
        );
        const sameName = subFlow(() => null, asStruct({ title: "Look up order" }) as never);

        await create.run(context(), "support", "", run, "hello", [lookup as never, sameName as never]);

        expect(requests[0].tools.map((tool) => tool.name)).toEqual(["Look_up_order", "Look_up_order_2"]);
        expect(requests[0].tools[0].description).toEqual("Looks an order up.");
        expect(requests[0].tools[0].input_schema).toEqual({
            title: "Look up order",
            description: "Looks an order up.",
            type: "object",
        });
    });

    it("rejects a tool entry that is neither a sub flow nor an MCP server", async () => {
        const { run } = scriptedModel([answer("ok")]);
        await expect(
            create.run(context(), "support", "", run, "hello", [{ nonsense: true }] as never),
        ).rejects.toThrow(/Entry 1 of "tools"/);
    });

    it("fails with a clear error when the model sub flow answers with the wrong shape", async () => {
        const run = subFlow(() => ({ message: { role: "ai", content: "not a list" } }));
        await expect(create.run(context(), "greeter", "", run, "hello")).rejects.toThrow(
            /did not return a valid model response/,
        );
    });
});

describe("what a middleware flow is handed", () => {
    it("is handed the conversation, the agent's name and the phase, and nothing more", async () => {
        const seen: AiAgentState[] = [];
        const { run } = scriptedModel([answer("ok")]);
        const observe = subFlow((input: never) => {
            seen.push(input as unknown as AiAgentState);
            return {};
        });

        await create.run(context(), "support", "You are helpful.", run, "hello", [], undefined, undefined, [observe]);

        expect(seen[0].context).toBeUndefined();
        expect(Object.keys(seen[0])).toEqual(["messages", "agent_name", "hook"]);
    });
});

describe("composing the shipped functions into an agent", () => {
    it("uses ai::middleware::trim_messages as a real middleware", async () => {
        const trim = new TrimMessagesMiddlewareFunction();
        const middlewareFlow = trim.run(context(), 200, "last", true);

        const { run, requests } = scriptedModel([answer("ok")]);
        const long = Array.from({ length: 12 }, (_, turn) =>
            turn % 2 === 0
                ? { role: "user" as const, content: `question ${turn} ${"padding ".repeat(40)}` }
                : { role: "assistant" as const, content: `answer ${turn} ${"padding ".repeat(40)}` },
        );

        const response = await create.run(
            context(),
            "support",
            "You are helpful.",
            run,
            "",
            [],
            undefined,
            { messages: long },
            [asFlowValue(middlewareFlow)],
        );

        expect(requests).toHaveLength(1);
        expect(requests[0].messages.length).toBeLessThan(long.length + 1);
        expect(requests[0].messages[0].role).toEqual("system");
        expect(replyOf(response)).toEqual("ok");
    });
});
