import type { AiContentBlock } from "../../message/datatypes/Message.contentBlock.datatype.js";
import type { AiChatContentPart } from "../datatypes/Chat.contentPart.datatype.js";

export function toImageBlock(part: AiChatContentPart): AiContentBlock {
    const image = part.image_url as { url?: string; detail?: string } | undefined;

    return {
        type: "image",
        ...(typeof image?.url === "string" ? { url: image.url } : {}),
        ...(image?.detail ? { detail: image.detail } : {}),
    };
}
