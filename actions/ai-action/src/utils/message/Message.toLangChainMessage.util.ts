import {
    AIMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
    type BaseMessage,
    type UsageMetadata,
} from "@langchain/core/messages";
import type { AiMessage } from "../../datatypes/message/Message.datatype.js";
import type { MessageFields } from "../../types/message/Message.types.js";

/** The block types a langchain message carries as calls rather than as content. */
const CALL_BLOCK_TYPES: string[] = ["tool_call", "invalid_tool_call"];

export function toLangChainMessage(message: AiMessage): BaseMessage {
    const fields: MessageFields = {
        content: message.content.filter((block) => !CALL_BLOCK_TYPES.includes(block.type)),
        ...(message.id ? { id: message.id } : {}),
        ...(message.name ? { name: message.name } : {}),
        ...(message.additional_kwargs ? { additional_kwargs: message.additional_kwargs } : {}),
        ...(message.response_metadata ? { response_metadata: message.response_metadata } : {}),
    };

    switch (message.role) {
        case "system":
            return new SystemMessage(fields);
        case "ai":
            // The calls are blocks of the content on our side and fields of the
            // message on langchain's, so they move out of the content here.
            return new AIMessage({
                ...fields,
                tool_calls: message.content
                    .filter((block) => block.type === "tool_call")
                    .map((block) => ({
                        id: typeof block.id === "string" ? block.id : undefined,
                        name: String(block.name ?? ""),
                        args: (block.args ?? {}) as Record<string, unknown>,
                    })),
                invalid_tool_calls: message.content
                    .filter((block) => block.type === "invalid_tool_call")
                    .map((block) => ({
                        id: typeof block.id === "string" ? block.id : undefined,
                        name: typeof block.name === "string" ? block.name : undefined,
                        args: typeof block.args === "string" ? block.args : undefined,
                        error: typeof block.error === "string" ? block.error : undefined,
                    })),
                ...(message.usage_metadata ? { usage_metadata: message.usage_metadata as UsageMetadata } : {}),
            });
        case "tool":
            return new ToolMessage({
                ...fields,
                tool_call_id: message.tool_call_id ?? "",
                ...(message.status ? { status: message.status } : {}),
                ...(message.artifact !== undefined ? { artifact: message.artifact } : {}),
            });
        case "human":
            return new HumanMessage(fields);
    }
}
