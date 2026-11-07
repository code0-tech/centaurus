import "reflect-metadata";
import { AIMessage } from "@langchain/core/messages";
import { describe, expect, it } from "vitest";
import { stripUndefined } from "../src/utils/shared/Shared.stripUndefined.util.js";
import { toFlowMessage } from "../src/utils/message/Message.toFlowMessage.util.js";

/** Walks a value and collects the paths that hold undefined - what hercules rejects. */
function undefinedPaths(value: unknown, path = "$"): string[] {
    if (value === undefined) return [path];
    if (Array.isArray(value)) return value.flatMap((entry, index) => undefinedPaths(entry, `${path}[${index}]`));
    if (typeof value === "object" && value !== null) {
        return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) =>
            undefinedPaths(entry, `${path}.${key}`),
        );
    }
    return [];
}

describe("stripping undefined before it reaches the serializer", () => {
    it("leaves out keys that hold undefined, however deep", () => {
        const cleaned = stripUndefined({
            model: "x",
            system_fingerprint: undefined,
            usage: { input: 3, details: { audio: undefined, text: 3 } },
        });

        expect(cleaned).toEqual({ model: "x", usage: { input: 3, details: { text: 3 } } });
        expect("system_fingerprint" in cleaned).toBe(false);
    });

    it("turns an undefined list entry into null rather than shifting the list", () => {
        expect(stripUndefined([1, undefined, 3])).toEqual([1, null, 3]);
    });

    it("keeps null, empty objects and empty lists, which are all representable", () => {
        expect(stripUndefined({ a: null, b: {}, c: [] })).toEqual({ a: null, b: {}, c: [] });
    });

    it("leaves plain values alone", () => {
        expect(stripUndefined("text")).toEqual("text");
        expect(stripUndefined(0)).toEqual(0);
        expect(stripUndefined(false)).toEqual(false);
        expect(stripUndefined(null)).toEqual(null);
    });
});

describe("a message carrying provider metadata", () => {
    it("reaches the flow without a single undefined in it", () => {
        const answer = new AIMessage({
            content: "Hi.",
            response_metadata: { model_name: "openai/gpt-oss-120b", system_fingerprint: undefined },
            usage_metadata: {
                input_tokens: 11,
                output_tokens: 3,
                total_tokens: 14,
                input_token_details: { audio: undefined, cache_read: 0 },
            },
            invalid_tool_calls: [{ name: "tool_1", args: "{broken", id: "call-0", error: undefined }],
        });

        const flat = toFlowMessage(answer);

        expect(undefinedPaths(flat)).toEqual([]);
        expect(flat.response_metadata).toEqual({ model_name: "openai/gpt-oss-120b" });
        expect(flat.usage_metadata).toEqual({
            input_tokens: 11,
            output_tokens: 3,
            total_tokens: 14,
            input_token_details: { cache_read: 0 },
        });
    });
});
