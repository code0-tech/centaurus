import { AIMessage, type UsageMetadata } from "@langchain/core/messages";
import type { AiMessage } from "../datatypes/Message.datatype.js";
import { toInvalidToolCalls } from "./Message.toInvalidToolCalls.util.js";
import { toToolCalls } from "./Message.toToolCalls.util.js";
import type { MessageFields } from "./Message.toMessageFields.util.js";

export function toAiMessage(message: AiMessage, fields: MessageFields): AIMessage {
    return new AIMessage({
        ...fields,
        tool_calls: toToolCalls(message),
        invalid_tool_calls: toInvalidToolCalls(message),
        ...(message.usage_metadata ? { usage_metadata: message.usage_metadata as UsageMetadata } : {}),
    });
}
