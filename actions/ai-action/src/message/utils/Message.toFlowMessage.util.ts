import * as lc from "@langchain/core/messages";
import type { AiContentBlock } from "../datatypes/Message.contentBlock.datatype.js";
import type { AiMessage } from "../datatypes/Message.datatype.js";
import type { AiMessageRole } from "../datatypes/Message.role.datatype.js";
import { hasEntries } from "../../shared/utils/Shared.hasEntries.util.js";

const ROLE_BY_TYPE: Record<string, AiMessageRole> = {
    system: "system",
    human: "human",
    ai: "ai",
    tool: "tool",
};

export function toFlowMessage(message: lc.BaseMessage): AiMessage {
    const flat: AiMessage = {
        role: ROLE_BY_TYPE[message.getType()] ?? "human",
        content: message.contentBlocks as AiContentBlock[],
    };

    if (message.id) flat.id = message.id;
    if (message.name) flat.name = message.name;
    if (hasEntries(message.additional_kwargs)) flat.additional_kwargs = message.additional_kwargs;
    if (hasEntries(message.response_metadata)) flat.response_metadata = message.response_metadata;

    if (lc.isToolMessage(message)) {
        flat.tool_call_id = message.tool_call_id;
        if (message.status) flat.status = message.status;
        if (message.artifact !== undefined) flat.artifact = message.artifact;
    }

    if (lc.isAIMessage(message)) {
        if (message.usage_metadata) flat.usage_metadata = message.usage_metadata;
        flat.content = [
            ...flat.content,
            ...(message.invalid_tool_calls ?? []).map((call) => ({ ...call, type: "invalid_tool_call" })),
        ];
    }

    return flat;
}
