import type { AiContentBlock } from "../../message/datatypes/Message.contentBlock.datatype.js";
import type { AiChatToolCall } from "../datatypes/Chat.toolCall.datatype.js";
import { describeError } from "../../shared/utils/Shared.describeError.util.js";

export function toToolCallBlock(call: AiChatToolCall): AiContentBlock {
    try {
        return {
            type: "tool_call",
            id: call.id,
            name: call.function.name,
            args: JSON.parse(call.function.arguments || "{}") as Record<string, unknown>,
        };
    } catch (error) {
        return {
            type: "invalid_tool_call",
            id: call.id,
            name: call.function.name,
            args: call.function.arguments,
            error: describeError(error),
        };
    }
}
