import "reflect-metadata";
import { type FunctionContext, type SubFlow } from "@code0-tech/hercules";
import { describe, expect, it } from "vitest";
import type { AiModelRequest } from "../src/datatypes/model/Model.request.datatype.js";
import type { AiModelResponse } from "../src/datatypes/model/Model.response.datatype.js";
import { ExtractInformationFunction } from "../src/runtimefunctions/extract/Extract.information.runtimefunction.js";

function subFlow(implementation: (input: never) => unknown, inputSchema?: Record<string, unknown>): SubFlow {
    const flow = (async (input: never) => implementation(input)) as unknown as { inputSchema?: unknown };
    if (inputSchema) flow.inputSchema = inputSchema;
    return flow as unknown as SubFlow;
}

function context(): FunctionContext {
    return {
        projectId: 1,
        executionId: "extract-execution",
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
 * such a node tells the extraction to ask the provider for the type directly instead
 * of binding it as a tool the model has to call.
 */
const nativeModelSchema: Record<string, unknown> = {
    type: "object",
    properties: { messages: {}, tools: {}, response_format: {} },
};

/** A data type's JSON schema, which is what a `TYPE` parameter carries. */
const invoiceType: Record<string, unknown> = {
    title: "Invoice",
    type: "object",
    properties: { number: { type: "string" }, total: { type: "number" } },
    required: ["number"],
};

/** Wraps a plain schema the way aquila sends it: a shared.Struct. */
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

const extract = new ExtractInformationFunction();
const text = "Invoice R-77 came to 42.50 euros.";

describe("ai::extract::information", () => {
    it("answers with the type's fields, read out of the text", async () => {
        const { run } = scriptedModel([answer("", [{ id: "call-1", name: "Invoice", args: { number: "R-77", total: 42.5 } }])]);

        await expect(extract.run(context(), text, invoiceType, run)).resolves.toEqual({
            number: "R-77",
            total: 42.5,
        });
    });

    it("sends the text as the only message and binds no tool but the type", async () => {
        const { run, requests } = scriptedModel([
            answer("", [{ id: "call-1", name: "Invoice", args: { number: "R-77" } }]),
        ]);

        await extract.run(context(), text, invoiceType, run);

        // One model call, with the system prompt ahead of the text, and the type as
        // the one tool there is - forced, because an offered tool may be skipped.
        expect(requests).toHaveLength(1);
        expect(requests[0].messages.map((message) => message.role)).toEqual(["system", "human"]);
        expect(requests[0].tools.map((tool) => tool.name)).toEqual(["Invoice"]);
        expect(requests[0].tool_choice).toBe("any");
    });

    it("asks a model that can constrain its own output for the type directly", async () => {
        const { run, requests } = scriptedModel(
            [answer(JSON.stringify({ number: "R-77", total: 42.5 }))],
            nativeModelSchema,
        );

        const read = await extract.run(context(), text, invoiceType, run);

        expect(requests[0].tools).toEqual([]);
        expect(requests[0].response_format?.schema).toMatchObject({
            properties: { number: { type: "string" }, total: { type: "number" } },
        });
        expect(read).toEqual({ number: "R-77", total: 42.5 });
    });

    it("puts the instructions behind its own, so they add to them instead of replacing them", async () => {
        const { run, requests } = scriptedModel([
            answer("", [{ id: "call-1", name: "Invoice", args: { number: "R-77" } }]),
        ]);

        await extract.run(context(), text, invoiceType, run, "Amounts are in euros.");

        const system: string = (requests[0].messages[0].content ?? [])
            .map((block) => String(block.text ?? ""))
            .join("");
        expect(system).toContain("Take nothing from outside the text");
        expect(system.endsWith("Amounts are in euros.")).toBe(true);
    });

    it("takes the type as the struct aquila wraps it in", async () => {
        const { run, requests } = scriptedModel([
            answer("", [{ id: "call-1", name: "Invoice", args: { number: "R-77" } }]),
        ]);

        await expect(extract.run(context(), text, asStruct(invoiceType), run)).resolves.toEqual({ number: "R-77" });
        expect(requests[0].tools.map((tool) => tool.name)).toEqual(["Invoice"]);
    });

    it("puts what was said before ahead of the prompt", async () => {
        const { run, requests } = scriptedModel([
            answer("", [{ id: "call-1", name: "Invoice", args: { number: "R-77" } }]),
        ]);

        await extract.run(context(), "what is the number?", invoiceType, run, undefined, {
            messages: [{ role: "user", content: text }],
        });

        // The system prompt, then the conversation, then what this call asks for.
        expect(requests[0].messages.map((message) => message.role)).toEqual(["system", "human", "human"]);
        expect(requests[0].messages[1].content).toEqual([{ type: "text", text }]);
    });

    it("reads a conversation without a prompt of its own", async () => {
        const { run, requests } = scriptedModel([
            answer("", [{ id: "call-1", name: "Invoice", args: { number: "R-77" } }]),
        ]);

        await expect(
            extract.run(context(), "", invoiceType, run, undefined, { messages: [{ role: "user", content: text }] }),
        ).resolves.toEqual({ number: "R-77" });
        expect(requests[0].messages.map((message) => message.role)).toEqual(["system", "human"]);
    });

    it("needs a text to read", async () => {
        const { run } = scriptedModel([answer("")]);

        await expect(extract.run(context(), "  ", invoiceType, run)).rejects.toThrow(/nothing to read/);
    });

    it("rejects a type that has no fields to fill", async () => {
        const { run } = scriptedModel([answer("")]);

        await expect(extract.run(context(), text, { type: "string" }, run)).rejects.toThrow(/type with fields/);
    });

    it("fails when the model answers in anything but the type", async () => {
        const { run } = scriptedModel([answer("The invoice is R-77.")]);

        await expect(extract.run(context(), text, invoiceType, run)).rejects.toThrow(/did not answer in the type/);
    });

    it("needs a model to read with", async () => {
        await expect(extract.run(context(), text, invoiceType, "gpt-4o")).rejects.toThrow(/has to be a sub flow/);
    });
});
