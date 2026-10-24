import { HumanMessage, SystemMessage, type BaseMessage } from "@langchain/core/messages";
import type { AiMessage } from "../datatypes/Message.datatype.js";
import { toAiMessage } from "./Message.toAiMessage.util.js";
import { toMessageFields, type MessageFields } from "./Message.toMessageFields.util.js";
import { toToolMessage } from "./Message.toToolMessage.util.js";

export function toLangChainMessage(message: AiMessage): BaseMessage {
    const fields: MessageFields = toMessageFields(message);

    switch (message.role) {
        case "system":
            return new SystemMessage(fields);
        case "ai":
            return toAiMessage(message, fields);
        case "tool":
            return toToolMessage(message, fields);
        case "human":
            return new HumanMessage(fields);
    }
}
