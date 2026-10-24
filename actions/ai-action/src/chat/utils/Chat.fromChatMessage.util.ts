import type { AiMessage } from "../../message/datatypes/Message.datatype.js";
import type { AiMessageRole } from "../../message/datatypes/Message.role.datatype.js";
import type { AiChatMessage } from "../datatypes/Chat.message.datatype.js";
import type { AiChatRole } from "../datatypes/Chat.role.datatype.js";
import { toContentBlocks } from "./Chat.toContentBlocks.util.js";
import { toToolCallBlock } from "./Chat.toToolCallBlock.util.js";

const ROLE_FROM_CHAT: Record<AiChatRole, AiMessageRole> = {
    system: "system",
    user: "human",
    assistant: "ai",
    tool: "tool",
};

export function fromChatMessage(message: AiChatMessage): AiMessage {
    const flat: AiMessage = {
        role: ROLE_FROM_CHAT[message.role],
        content: [...toContentBlocks(message.content), ...(message.tool_calls ?? []).map(toToolCallBlock)],
    };

    if (message.name) flat.name = message.name;
    if (message.tool_call_id) flat.tool_call_id = message.tool_call_id;

    return flat;
}
