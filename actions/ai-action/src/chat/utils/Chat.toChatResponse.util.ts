import { randomUUID } from "node:crypto";
import type { AiMessage } from "../../message/datatypes/Message.datatype.js";
import type { AiChatMessage } from "../datatypes/Chat.message.datatype.js";
import type { AiChatResponse } from "../datatypes/Chat.response.datatype.js";
import type { AiChatUsage } from "../datatypes/Chat.usage.datatype.js";
import { reportedModel } from "./Chat.reportedModel.util.js";
import { toChatMessage } from "./Chat.toChatMessage.util.js";
import { toChatUsage } from "./Chat.toChatUsage.util.js";

export function toChatResponse(answer: AiMessage, fallbackModel: string): AiChatResponse {
    const message: AiChatMessage = toChatMessage(answer);
    const usage: AiChatUsage | undefined = toChatUsage(answer);

    return {
        id: answer.id ?? `chatcmpl-${randomUUID()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: reportedModel(answer, fallbackModel),
        choices: [{ index: 0, message, finish_reason: message.tool_calls ? "tool_calls" : "stop" }],
        ...(usage ? { usage } : {}),
    };
}
