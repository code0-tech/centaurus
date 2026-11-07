import type { AiContentBlock } from "../../datatypes/message/Message.contentBlock.datatype.js";
import type { AiMessage } from "../../datatypes/message/Message.datatype.js";
import type { AiMessageRole } from "../../datatypes/message/Message.role.datatype.js";
import type { AiChatMessage } from "../../datatypes/chat/Chat.message.datatype.js";
import type { AiChatRole } from "../../datatypes/chat/Chat.role.datatype.js";
import { describeError } from "../shared/Shared.describeError.util.js";

const ROLE_FROM_CHAT: Record<AiChatRole, AiMessageRole> = {
    system: "system",
    user: "human",
    assistant: "ai",
    tool: "tool",
};

export function fromChatMessage(message: AiChatMessage): AiMessage {
    const content: AiChatMessage["content"] = message.content;

    const flat: AiMessage = {
        role: ROLE_FROM_CHAT[message.role],
        content: [
            // A client may send the content as one string or as parts; a part is
            // carried over as it is unless it is one of the two shapes the chat
            // protocol spells differently to a message block.
            ...(typeof content === "string"
                ? content.length > 0
                    ? [{ type: "text", text: content } as AiContentBlock]
                    : []
                : Array.isArray(content)
                  ? content.map((part): AiContentBlock => {
                        if (part.type === "text") {
                            return { type: "text", text: typeof part.text === "string" ? part.text : "" };
                        }

                        if (part.type === "image_url") {
                            const image = part.image_url as { url?: string; detail?: string } | undefined;
                            return {
                                type: "image",
                                ...(typeof image?.url === "string" ? { url: image.url } : {}),
                                ...(image?.detail ? { detail: image.detail } : {}),
                            };
                        }

                        return part;
                    })
                  : []),
            // The arguments travel as a JSON string, and a model that wrote nothing
            // parsable is kept as the invalid call it made rather than dropped.
            ...(message.tool_calls ?? []).map((call): AiContentBlock => {
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
            }),
        ],
    };

    if (message.name) flat.name = message.name;
    if (message.tool_call_id) flat.tool_call_id = message.tool_call_id;

    return flat;
}
