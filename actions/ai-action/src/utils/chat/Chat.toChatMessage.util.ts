import { randomUUID } from "node:crypto";
import type { AiMessage } from "../../datatypes/message/Message.datatype.js";
import type { AiMessageRole } from "../../datatypes/message/Message.role.datatype.js";
import type { AiChatMessage } from "../../datatypes/chat/Chat.message.datatype.js";
import type { AiChatRole } from "../../datatypes/chat/Chat.role.datatype.js";
import type { AiChatToolCall } from "../../datatypes/chat/Chat.toolCall.datatype.js";
import { toChatContent } from "./Chat.toChatContent.util.js";

const ROLE_TO_CHAT: Record<AiMessageRole, AiChatRole> = {
    system: "system",
    human: "user",
    ai: "assistant",
    tool: "tool",
};

export function toChatMessage(message: AiMessage): AiChatMessage {
    // A call reaches a client as a function call with its arguments as a string, and
    // an id it can answer under - which a model that left it out still needs.
    const toolCalls: AiChatToolCall[] = message.content
        .filter((block) => block.type === "tool_call")
        .map((block) => ({
            id: typeof block.id === "string" ? block.id : randomUUID(),
            type: "function" as const,
            function: {
                name: String(block.name ?? ""),
                arguments: JSON.stringify(block.args ?? {}),
            },
        }));
    const content: string = toChatContent(message);

    return {
        role: ROLE_TO_CHAT[message.role],
        content: content.length > 0 || toolCalls.length === 0 ? content : null,
        ...(message.name ? { name: message.name } : {}),
        ...(message.tool_call_id ? { tool_call_id: message.tool_call_id } : {}),
        ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
    };
}
