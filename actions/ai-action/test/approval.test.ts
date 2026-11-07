import "reflect-metadata";
import type { FunctionContext, SubFlow } from "@code0-tech/hercules";
import { describe, expect, it } from "vitest";
import type { AiChatResponse } from "../src/datatypes/chat/Chat.response.datatype.js";
import type { AiModelResponse } from "../src/datatypes/model/Model.response.datatype.js";
import { CreateAgentFunction } from "../src/runtimefunctions/agent/Agent.create.runtimefunction.js";
import { HumanInTheLoopMiddlewareFunction } from "../src/runtimefunctions/middleware/Middleware.humanInTheLoop.runtimefunction.js";
import { askFor } from "../src/utils/middleware/Approval.askFor.util.js";
import { describeCall } from "../src/utils/middleware/Approval.describeCall.util.js";
import { newCode } from "../src/utils/middleware/Approval.newCode.util.js";

const create = new CreateAgentFunction();
const humanInTheLoop = new HumanInTheLoopMiddlewareFunction();

/**
 * The middleware as a flow receives it: the function returns a sub flow function, and
 * hercules hands the consuming node a callable.
 */
function asMiddleware(tools: string[]): SubFlow {
    const definition = humanInTheLoop.run(context(), tools);
    return ((state: unknown) => Promise.resolve(definition.run(state as never))) as unknown as SubFlow;
}

/** The question for one call, as the middleware wrote it, with a known code. */
const question = (call: { name: string; args?: Record<string, unknown> }, code: string): string =>
    askFor([call], code);

function context(): FunctionContext {
    return {
        projectId: 1,
        executionId: "approval-execution",
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
    let call = 0;
    const requests: unknown[] = [];
    const run = (async (input: unknown) => {
        requests.push(input);
        return responses[Math.min(call++, responses.length - 1)];
    }) as unknown as SubFlow;
    return { run, requests };
}

function tool(name: string, calls: unknown[], answers: unknown = { ok: true }): SubFlow {
    const run = (async (args: unknown) => {
        calls.push({ [name]: args });
        return answers;
    }) as unknown as { inputSchema?: unknown };
    run.inputSchema = { type: "object", title: name, description: `Runs ${name}.`, properties: {} };
    return run as unknown as SubFlow;
}

type Turn = { role: "user" | "assistant"; content: string };

/** One request on /chat/completions: the whole conversation, as a client resends it. */
function chat(
    model: SubFlow,
    tools: SubFlow[],
    conversation: Turn[],
    askBefore: string[] = ["refund"],
): Promise<AiChatResponse> {
    return create.run(
        context(),
        "support",
        "You help.",
        model,
        "",
        tools,
        undefined,
        { messages: conversation } as never,
        [asMiddleware(askBefore)],
    );
}

describe("what the answer carries about the agent's work", () => {
    it("lists every tool the agent used, with arguments and result", async () => {
        const calls: unknown[] = [];
        const { run } = scriptedModel([
            answer("", [{ id: "c1", name: "lookup", args: { order: "A-1" } }]),
            answer("Order A-1 has shipped."),
        ]);

        const response = await chat(run, [tool("lookup", calls, { status: "shipped" })], [
            { role: "user", content: "where is A-1?" },
        ]);

        expect(response.steps).toEqual([
            { name: "lookup", args: { order: "A-1" }, result: '{"status":"shipped"}' },
        ]);
        expect(response.choices[0].message.content).toEqual("Order A-1 has shipped.");
    });

    it("reports what a failed tool answered as that step's result", async () => {
        const broken = (async () => {
            throw new Error("the warehouse is offline");
        }) as unknown as { inputSchema?: unknown };
        broken.inputSchema = { type: "object", title: "lookup", description: "Looks an order up.", properties: {} };
        const { run } = scriptedModel([
            answer("", [{ id: "c1", name: "lookup", args: {} }]),
            answer("That did not work."),
        ]);

        const response = await chat(run, [broken as unknown as SubFlow], [{ role: "user", content: "status?" }]);

        // The step is named after the call the model made, and the tool's failure is
        // what came back from it.
        expect(response.steps?.[0].name).toEqual("lookup");
        expect(response.steps?.[0].result).toContain("the warehouse is offline");
    });

    it("carries no steps when the agent answered on its own", async () => {
        const { run } = scriptedModel([answer("Hello.")]);

        const response = await chat(run, [], [{ role: "user", content: "hi" }]);

        expect(response.steps).toBeUndefined();
    });

    it("needs a tool to guard", () => {
        expect(() => humanInTheLoop.run(context(), [])).toThrow(/at least one tool/);
        expect(() => humanInTheLoop.run(context(), [7] as never)).toThrow(/Entry 1 of "tools"/);
    });

    it("is a middleware like any other, which is how an agent gets it", () => {
        const definition = humanInTheLoop.run(context(), ["refund"]);

        expect(definition.name).toEqual("human_in_the_loop:refund");
        expect(definition.inputSchema).toBeDefined();
        expect(definition.outputSchema).toBeDefined();
    });
});

describe("a tool the agent has to ask about", () => {
    it("is held back, and the turn ends with the question", async () => {
        const calls: unknown[] = [];
        const { run } = scriptedModel([answer("", [{ id: "c1", name: "refund", args: { order: "A-1" } }])]);

        const response = await chat(run, [tool("refund", calls)], [{ role: "user", content: "refund A-1" }]);

        expect(calls).toEqual([]);
        // The question carries the calls and the two answers, and no sentence: it has
        // to work in any language the flow is used in.
        const asked = String(response.choices[0].message.content);
        expect(asked).toMatch(/^refund\(\{"order":"A-1"\}\)\n\nAPPROVE [0-9a-f]{6}\nDECLINE [0-9a-f]{6}$/);
        expect(asked).not.toMatch(/[a-z]{4,} [a-z]{3,}/);
        expect(response.awaiting_approval?.[0]).toMatchObject({ name: "refund", args: { order: "A-1" } });
        expect(response.awaiting_approval?.[0].code).toMatch(/^[0-9a-f]{6}$/);
        // The answer is a finished turn, not a half-open one.
        expect(response.choices[0].finish_reason).toEqual("stop");
    });

    it("runs the call when the reply carries the question's approval code", async () => {
        const calls: unknown[] = [];
        const refund = tool("refund", calls, { refunded: true });
        // A model that wants the same call both times, as one would after an approval.
        const wants = () =>
            scriptedModel([
                answer("", [{ id: "c1", name: "refund", args: { order: "A-1" } }]),
                answer("Refunded A-1."),
            ]).run;

        // Turn one: the question, whose code the answer has to carry.
        const asked = await chat(wants(), [refund], [{ role: "user", content: "refund A-1" }]);
        const code: string = asked.awaiting_approval![0].code!;

        // Turn two: a request of its own, with the conversation the client resends.
        const done = await chat(wants(), [refund], [
            { role: "user", content: "refund A-1" },
            { role: "assistant", content: String(asked.choices[0].message.content) },
            { role: "user", content: `APPROVE ${code}` },
        ]);

        expect(calls).toEqual([{ refund: { order: "A-1" } }]);
        expect(done.awaiting_approval).toBeUndefined();
        expect(done.choices[0].message.content).toEqual("Refunded A-1.");
        expect(done.steps).toEqual([{ name: "refund", args: { order: "A-1" }, result: '{"refunded":true}' }]);
    });

    it("does not run a call the reply refused, however the model insists", async () => {
        const calls: unknown[] = [];
        const refund = tool("refund", calls);
        const { run } = scriptedModel([answer("", [{ id: "c1", name: "refund", args: { order: "A-1" } }])]);

        const response = await chat(
            run,
            [refund],
            [
                { role: "user", content: "refund A-1" },
                { role: "assistant", content: question({ name: "refund", args: { order: "A-1" } }, "abc123") },
                { role: "user", content: "DECLINE abc123" },
            ],
        );

        expect(calls).toEqual([]);
        // The refusal is reported the same way the question was asked: markers, no prose.
        expect(response.choices[0].message.content).toEqual('DECLINE abc123\nrefund({"order":"A-1"})');
        expect(response.awaiting_approval).toBeUndefined();
    });

    it("runs nothing on a reply that does not carry the code, however it is worded", async () => {
        const calls: unknown[] = [];
        const refund = tool("refund", calls);

        for (const reply of ["yes", "ja, mach das", "approve", "APPROVE deadbeef", "sure, go ahead"]) {
            const { run } = scriptedModel([answer("", [{ id: "c1", name: "refund", args: { order: "A-1" } }])]);
            const response = await chat(run, [refund], [
                { role: "user", content: "refund A-1" },
                { role: "assistant", content: question({ name: "refund", args: { order: "A-1" } }, "abc123") },
                { role: "user", content: reply },
            ]);

            // The question stands, with its own code - nothing was released.
            expect(calls).toEqual([]);
            expect(response.awaiting_approval?.[0].code).toEqual("abc123");
        }
    });

    it("spends an approval on one call, so the next one is asked about again", async () => {
        const calls: unknown[] = [];
        const refund = tool("refund", calls);
        const wants = () =>
            scriptedModel([
                answer("", [{ id: "c1", name: "refund", args: { order: "A-1" } }]),
                answer("Refunded A-1."),
            ]).run;

        const asked = question({ name: "refund", args: { order: "A-1" } }, "abc123");

        // The approval of the first call, which the agent carries out.
        const first = await chat(wants(), [refund], [
            { role: "user", content: "refund A-1" },
            { role: "assistant", content: asked },
            { role: "user", content: "APPROVE abc123" },
        ]);
        expect(calls).toHaveLength(1);

        // The same call again, with the spent approval still in the conversation.
        const again = await chat(wants(), [refund], [
            { role: "user", content: "refund A-1" },
            { role: "assistant", content: asked },
            { role: "user", content: "APPROVE abc123" },
            { role: "assistant", content: String(first.choices[0].message.content) },
            { role: "user", content: "do it again" },
        ]);

        expect(calls).toHaveLength(1);
        expect(again.awaiting_approval?.[0]).toMatchObject({ name: "refund", args: { order: "A-1" } });
        // A new question, so the old approval cannot release it.
        expect(again.awaiting_approval?.[0].code).not.toEqual("abc123");
    });

    it("asks again for a different call", async () => {
        const calls: unknown[] = [];
        const { run } = scriptedModel([answer("", [{ id: "c2", name: "refund", args: { order: "B-2" } }])]);

        const response = await chat(run, [tool("refund", calls)], [
            { role: "user", content: "refund A-1" },
            { role: "assistant", content: question({ name: "refund", args: { order: "A-1" } }, "abc123") },
            { role: "user", content: "APPROVE abc123" },
            { role: "user", content: "and refund B-2" },
        ]);

        expect(calls).toEqual([]);
        expect(response.awaiting_approval?.[0]).toMatchObject({ name: "refund", args: { order: "B-2" } });
        expect(response.awaiting_approval?.[0].code).not.toEqual("abc123");
    });

    it("leaves tools nobody asked about alone", async () => {
        const calls: unknown[] = [];
        const { run } = scriptedModel([
            answer("", [{ id: "c1", name: "lookup", args: { order: "A-1" } }]),
            answer("It shipped."),
        ]);

        const response = await chat(run, [tool("lookup", calls)], [{ role: "user", content: "where is A-1?" }]);

        expect(calls).toEqual([{ lookup: { order: "A-1" } }]);
        expect(response.awaiting_approval).toBeUndefined();
    });

    it("writes a call the same way in the question and when matching it back", () => {
        expect(describeCall({ name: "refund", args: { order: "A-1" } })).toEqual('refund({"order":"A-1"})');
        expect(askFor([{ name: "refund", args: { order: "A-1" } }], "abc123")).toContain('refund({"order":"A-1"})');
    });

    it("gives every question a code of its own", () => {
        expect(newCode()).not.toEqual(newCode());
        expect(newCode()).toMatch(/^[0-9a-f]{6}$/);
    });
});
