import type { AiMessage } from "../../message/datatypes/Message.datatype.js";

export function toChatContent(message: AiMessage): string {
    return message.content
        .filter((block) => block.type === "text")
        .map((block) => (typeof block.text === "string" ? block.text : ""))
        .join("");
}
