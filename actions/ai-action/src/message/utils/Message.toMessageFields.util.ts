import type { AiContentBlock } from "../datatypes/Message.contentBlock.datatype.js";
import type { AiMessage } from "../datatypes/Message.datatype.js";

const CALL_BLOCK_TYPES: string[] = ["tool_call", "invalid_tool_call"];

export interface MessageFields {
    content: AiContentBlock[];
    id?: string;
    name?: string;
    additional_kwargs?: Record<string, unknown>;
    response_metadata?: Record<string, unknown>;
}

export function toMessageFields(message: AiMessage): MessageFields {
    return {
        content: message.content.filter((block) => !CALL_BLOCK_TYPES.includes(block.type)),
        ...(message.id ? { id: message.id } : {}),
        ...(message.name ? { name: message.name } : {}),
        ...(message.additional_kwargs ? { additional_kwargs: message.additional_kwargs } : {}),
        ...(message.response_metadata ? { response_metadata: message.response_metadata } : {}),
    };
}
