import type { ToolCall } from "@langchain/core/messages";
import type { AiMessage } from "../datatypes/Message.datatype.js";

export function toToolCalls(message: AiMessage): ToolCall[] {
    return message.content
        .filter((block) => block.type === "tool_call")
        .map((block) => ({
            id: typeof block.id === "string" ? block.id : undefined,
            name: String(block.name ?? ""),
            args: (block.args ?? {}) as Record<string, unknown>,
        }));
}
