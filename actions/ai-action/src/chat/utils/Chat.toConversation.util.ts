import type { AiChatMessage } from "../datatypes/Chat.message.datatype.js";
import type { AiMessage } from "../../message/datatypes/Message.datatype.js";
import { fromChatMessage } from "./Chat.fromChatMessage.util.js";

export function toConversation(history: AiChatMessage[], prompt: string): AiMessage[] {
    const question: AiMessage[] =
        prompt.length > 0 ? [{ role: "human", content: [{ type: "text", text: prompt }] }] : [];

    return [...history.map(fromChatMessage), ...question];
}
