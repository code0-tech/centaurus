import { randomUUID } from "node:crypto";
import type { AiMessage } from "../../message/datatypes/Message.datatype.js";
import type { AiChatToolCall } from "../datatypes/Chat.toolCall.datatype.js";

export function toChatToolCalls(message: AiMessage): AiChatToolCall[] {
    return message.content
        .filter((block) => block.type === "tool_call")
        .map((block) => ({
            id: typeof block.id === "string" ? block.id : randomUUID(),
            type: "function" as const,
            function: {
                name: String(block.name ?? ""),
                arguments: JSON.stringify(block.args ?? {}),
            },
        }));
}
