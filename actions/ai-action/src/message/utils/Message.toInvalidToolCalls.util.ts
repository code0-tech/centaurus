import type { InvalidToolCall } from "@langchain/core/messages";
import type { AiMessage } from "../datatypes/Message.datatype.js";

export function toInvalidToolCalls(message: AiMessage): InvalidToolCall[] {
    return message.content
        .filter((block) => block.type === "invalid_tool_call")
        .map((block) => ({
            id: typeof block.id === "string" ? block.id : undefined,
            name: typeof block.name === "string" ? block.name : undefined,
            args: typeof block.args === "string" ? block.args : undefined,
            error: typeof block.error === "string" ? block.error : undefined,
        }));
}
