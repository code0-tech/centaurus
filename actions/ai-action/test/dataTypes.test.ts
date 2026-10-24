import "reflect-metadata";
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { describe, expect, it } from "vitest";
import { fromChatMessage } from "../src/chat/utils/Chat.fromChatMessage.util.js";
import { toChatMessage } from "../src/chat/utils/Chat.toChatMessage.util.js";
import { toChatResponse } from "../src/chat/utils/Chat.toChatResponse.util.js";
import { toFlowMessage } from "../src/message/utils/Message.toFlowMessage.util.js";
import { toLangChainMessage } from "../src/message/utils/Message.toLangChainMessage.util.js";
import type { AiChatMessage } from "../src/chat/datatypes/Chat.message.datatype.js";
import { AiMcpServerSchema } from "../src/mcp/datatypes/Mcp.server.datatype.js";
import { AiMessageSchema } from "../src/message/datatypes/Message.datatype.js";
import { AiStateUpdateSchema } from "../src/middleware/datatypes/Middleware.stateUpdate.datatype.js";
import { AiModelRequestSchema } from "../src/model/datatypes/Model.request.datatype.js";
import { AiModelResponseSchema } from "../src/model/datatypes/Model.response.datatype.js";

describe("AiModelResponseSchema", () => {
    it("accepts a tool-only turn, which carries no text block at all", () => {
        const parsed = AiModelResponseSchema.parse({
            message: {
                role: "ai",
                content: [{ type: "tool_call", id: "call-1", name: "tool_1", args: { q: "x" } }],
            },
        });
        expect(parsed.message.content).toHaveLength(1);
    });

    it("keeps a reasoning block, which is the point of using content blocks", () => {
        const parsed = AiModelResponseSchema.parse({
            message: {
                role: "ai",
                content: [
                    { type: "reasoning", reasoning: "a chain of thought" },
                    { type: "text", text: "the answer" },
                ],
            },
        });
        expect(parsed.message.content[0]).toEqual({ type: "reasoning", reasoning: "a chain of thought" });
    });

    it("rejects a response without a message", () => {
        expect(() => AiModelResponseSchema.parse({ content: "hello" })).toThrow();
    });

    it("rejects a content block without a type", () => {
        expect(() =>
            AiModelResponseSchema.parse({ message: { role: "ai", content: [{ text: "no type" }] } }),
        ).toThrow();
    });
});

describe("AiModelRequestSchema", () => {
    it("requires the conversation and the advertised tools", () => {
        expect(() => AiModelRequestSchema.parse({ messages: [] })).toThrow();
        expect(() => AiModelRequestSchema.parse({ messages: [], tools: [] })).not.toThrow();
    });
});

describe("AiStateUpdateSchema", () => {
    it("accepts an empty update, which is how an observing middleware answers", () => {
        expect(AiStateUpdateSchema.parse({})).toEqual({});
    });

    it("rejects a jump target the agent has no node for", () => {
        expect(() => AiStateUpdateSchema.parse({ jump_to: "somewhere" })).toThrow();
    });
});

describe("AiMcpServerSchema", () => {
    it("defaults to the streamable http transport", () => {
        expect(AiMcpServerSchema.parse({ name: "docs", url: "https://mcp.example.com/mcp" }).transport).toEqual("http");
    });

    it("keeps headers as a free-form map", () => {
        const parsed = AiMcpServerSchema.parse({
            name: "docs",
            url: "https://mcp.example.com/mcp",
            headers: { Authorization: "Bearer token" },
        });
        expect(parsed.headers).toEqual({ Authorization: "Bearer token" });
    });
});

describe("message conversion", () => {
    it("maps every LangChain message type onto a role", () => {
        expect(toFlowMessage(new SystemMessage("s")).role).toEqual("system");
        expect(toFlowMessage(new HumanMessage("h")).role).toEqual("human");
        expect(toFlowMessage(new AIMessage("a")).role).toEqual("ai");
        expect(toFlowMessage(new ToolMessage({ content: "t", tool_call_id: "call-1" })).role).toEqual("tool");
    });

    it("carries tool calls across as tool_call content blocks", () => {
        const flat = toFlowMessage(
            new AIMessage({ content: "", tool_calls: [{ id: "call-1", name: "tool_1", args: { q: "x" } }] }),
        );
        expect(AiMessageSchema.parse(flat).content).toEqual([
            { type: "text", text: "" },
            { type: "tool_call", id: "call-1", name: "tool_1", args: { q: "x" } },
        ]);
    });

    it("keeps every content block instead of flattening them to text", () => {
        const flat = toFlowMessage(
            new AIMessage({
                content: [
                    { type: "reasoning", reasoning: "a chain of thought" },
                    { type: "text", text: "the answer" },
                ],
            }),
        );
        expect(flat.content).toEqual([
            { type: "reasoning", reasoning: "a chain of thought" },
            { type: "text", text: "the answer" },
        ]);
    });

    it("keeps an image block, which a flattened message would have lost", () => {
        const flat = toFlowMessage(
            new HumanMessage({
                content: [
                    { type: "text", text: "what is this" },
                    { type: "image", url: "https://example.com/a.png", mime_type: "image/png" },
                ],
            }),
        );
        expect(flat.content[1]).toEqual({
            type: "image",
            url: "https://example.com/a.png",
            mime_type: "image/png",
        });
    });

    it("keeps the provider's metadata and token usage on a generation", () => {
        const flat = toFlowMessage(
            new AIMessage({
                content: "done",
                response_metadata: { finish_reason: "stop", model_name: "claude" },
                usage_metadata: { input_tokens: 1, output_tokens: 2, total_tokens: 3 },
            }),
        );
        expect(flat.response_metadata).toMatchObject({ finish_reason: "stop", model_name: "claude" });
        expect(flat.usage_metadata).toMatchObject({ input_tokens: 1, output_tokens: 2, total_tokens: 3 });
    });

    it("round-trips every message shape through a flow and back", () => {
        for (const message of [
            new SystemMessage("s"),
            new HumanMessage({
                content: [
                    { type: "text", text: "look" },
                    { type: "image", url: "https://example.com/a.png", mime_type: "image/png" },
                ],
            }),
            new AIMessage({
                content: [
                    { type: "reasoning", reasoning: "chain" },
                    { type: "text", text: "a" },
                ],
                tool_calls: [{ id: "call-1", name: "tool_1", args: { q: "x" } }],
                response_metadata: { finish_reason: "tool_calls" },
                usage_metadata: { input_tokens: 1, output_tokens: 2, total_tokens: 3 },
            }),
            new ToolMessage({
                content: "t",
                tool_call_id: "call-1",
                name: "tool_1",
                artifact: { rows: [1, 2, 3] },
                status: "error",
            }),
            new AIMessage({
                content: "",
                additional_kwargs: { refusal: "no" },
                invalid_tool_calls: [{ id: "call-2", name: "tool_1", args: "{broken", error: "bad json" }],
            }),
        ]) {
            const flat = toFlowMessage(message);
            const rebuilt = toFlowMessage(toLangChainMessage(flat));
            expect(rebuilt).toEqual(flat);
        }
    });

    it("keeps a tool message's artifact and status, which the model never sees", () => {
        const flat = toFlowMessage(
            new ToolMessage({
                content: "42 rows",
                tool_call_id: "call-1",
                name: "query",
                artifact: { rows: [1, 2, 3] },
                status: "error",
            }),
        );
        expect(flat.artifact).toEqual({ rows: [1, 2, 3] });
        expect(flat.status).toEqual("error");

        const rebuilt = toLangChainMessage(flat) as ToolMessage;
        expect(rebuilt.artifact).toEqual({ rows: [1, 2, 3] });
        expect(rebuilt.status).toEqual("error");
    });

    it("keeps a provider's extras, which have no standard field of their own", () => {
        const flat = toFlowMessage(new AIMessage({ content: "hi", additional_kwargs: { refusal: "no" } }));
        expect(flat.additional_kwargs).toEqual({ refusal: "no" });
        expect(toLangChainMessage(flat).additional_kwargs).toEqual({ refusal: "no" });
    });

    it("keeps a malformed tool call, so a middleware can repair it", () => {
        const flat = toFlowMessage(
            new AIMessage({
                content: "",
                invalid_tool_calls: [{ id: "call-1", name: "query", args: "{not json", error: "bad json" }],
            }),
        );
        expect(flat.content.filter((block: { type: string }) => block.type === "invalid_tool_call")).toEqual([
            { type: "invalid_tool_call", id: "call-1", name: "query", args: "{not json", error: "bad json" },
        ]);

        const rebuilt = toLangChainMessage(flat) as AIMessage;
        expect(rebuilt.invalid_tool_calls).toEqual([
            { id: "call-1", name: "query", args: "{not json", error: "bad json" },
        ]);
        expect(rebuilt.content).toEqual([{ type: "text", text: "" }]);
    });

    it("does not invent empty metadata where the provider sent none", () => {
        const flat = toFlowMessage(new HumanMessage("plain"));
        expect(flat.additional_kwargs).toBeUndefined();
        expect(flat.response_metadata).toBeUndefined();
    });

    it("does not duplicate a tool call when rebuilding a generation", () => {
        const flat = toFlowMessage(
            new AIMessage({ content: "", tool_calls: [{ id: "call-1", name: "tool_1", args: {} }] }),
        );
        const rebuilt = toLangChainMessage(flat);
        expect(rebuilt.contentBlocks.filter((block: { type: string }) => block.type === "tool_call")).toHaveLength(1);
        expect((rebuilt as AIMessage).tool_calls).toHaveLength(1);
    });
});

describe("OpenAI chat completion conversion", () => {
    it("maps every OpenAI role onto one of ours and back", () => {
        const roles: AiChatMessage["role"][] = ["system", "user", "assistant", "tool"];
        expect(roles.map((role) => fromChatMessage({ role, content: "x" }).role)).toEqual([
            "system",
            "human",
            "ai",
            "tool",
        ]);
        expect(roles.map((role) => toChatMessage(fromChatMessage({ role, content: "x" })).role)).toEqual(roles);
    });

    it("says null rather than an empty string when a turn only asks for tools", () => {
        const message = toChatMessage({
            role: "ai",
            content: [{ type: "tool_call", id: "call-1", name: "tool_1", args: { a: 1 } }],
        });

        expect(message.content).toBeNull();
        expect(message.tool_calls).toEqual([
            { id: "call-1", type: "function", function: { name: "tool_1", arguments: '{"a":1}' } },
        ]);
    });

    it("reports a turn that asks for tools as finish_reason tool_calls", () => {
        const response = toChatResponse(
            {
                role: "ai",
                content: [{ type: "tool_call", id: "call-1", name: "tool_1", args: {} }],
            },
            "fallback-model",
        );

        expect(response.choices[0].finish_reason).toEqual("tool_calls");
        expect(response.model).toEqual("fallback-model");
        expect(response.id).toMatch(/^chatcmpl-/);
    });

    it("carries an unknown content part through rather than destroying it", () => {
        const flat = fromChatMessage({
            role: "user",
            content: [{ type: "input_audio", input_audio: { data: "AAA", format: "wav" } }],
        });

        expect(flat.content).toEqual([{ type: "input_audio", input_audio: { data: "AAA", format: "wav" } }]);
    });

    it("leaves out usage when the model reported none", () => {
        expect(toChatResponse({ role: "ai", content: [{ type: "text", text: "hi" }] }, "m").usage).toBeUndefined();
    });
});
