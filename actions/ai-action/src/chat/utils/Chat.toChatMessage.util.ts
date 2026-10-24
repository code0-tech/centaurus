import type { AiMessage } from "../../message/datatypes/Message.datatype.js";
import type { AiMessageRole } from "../../message/datatypes/Message.role.datatype.js";
import type { AiChatMessage } from "../datatypes/Chat.message.datatype.js";
import type { AiChatRole } from "../datatypes/Chat.role.datatype.js";
import type { AiChatToolCall } from "../datatypes/Chat.toolCall.datatype.js";
import { toChatContent } from "./Chat.toChatContent.util.js";
import { toChatToolCalls } from "./Chat.toChatToolCalls.util.js";

const ROLE_TO_CHAT: Record<AiMessageRole, AiChatRole> = {
    system: "system",
    human: "user",
    ai: "assistant",
    tool: "tool",
};

export function toChatMessage(message: AiMessage): AiChatMessage {
    const toolCalls: AiChatToolCall[] = toChatToolCalls(message);
    const content: string = toChatContent(message);

    return {
        role: ROLE_TO_CHAT[message.role],
        content: content.length > 0 || toolCalls.length === 0 ? content : null,
        ...(message.name ? { name: message.name } : {}),
        ...(message.tool_call_id ? { tool_call_id: message.tool_call_id } : {}),
        ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
    };
}
