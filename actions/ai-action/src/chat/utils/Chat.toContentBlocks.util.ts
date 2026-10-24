import type { AiContentBlock } from "../../message/datatypes/Message.contentBlock.datatype.js";
import type { AiChatMessage } from "../datatypes/Chat.message.datatype.js";
import { toContentBlock } from "./Chat.toContentBlock.util.js";

export function toContentBlocks(content: AiChatMessage["content"]): AiContentBlock[] {
    if (typeof content === "string") return content.length > 0 ? [{ type: "text", text: content }] : [];
    if (Array.isArray(content)) return content.map(toContentBlock);
    return [];
}
