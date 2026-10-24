import type { AiContentBlock } from "../../message/datatypes/Message.contentBlock.datatype.js";
import type { AiChatContentPart } from "../datatypes/Chat.contentPart.datatype.js";
import { toImageBlock } from "./Chat.toImageBlock.util.js";

export function toContentBlock(part: AiChatContentPart): AiContentBlock {
    if (part.type === "text") return { type: "text", text: typeof part.text === "string" ? part.text : "" };
    if (part.type === "image_url") return toImageBlock(part);
    return part;
}
