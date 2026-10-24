import { ToolMessage } from "@langchain/core/messages";
import type { AiMessage } from "../datatypes/Message.datatype.js";
import type { MessageFields } from "./Message.toMessageFields.util.js";

export function toToolMessage(message: AiMessage, fields: MessageFields): ToolMessage {
    return new ToolMessage({
        ...fields,
        tool_call_id: message.tool_call_id ?? "",
        ...(message.status ? { status: message.status } : {}),
        ...(message.artifact !== undefined ? { artifact: message.artifact } : {}),
    });
}
