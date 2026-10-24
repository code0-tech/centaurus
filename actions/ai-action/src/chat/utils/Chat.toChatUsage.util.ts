import type { AiMessage } from "../../message/datatypes/Message.datatype.js";
import type { AiChatUsage } from "../datatypes/Chat.usage.datatype.js";

export function toChatUsage(message: AiMessage): AiChatUsage | undefined {
    const usage = message.usage_metadata;
    if (!usage) return undefined;

    const prompt: number = typeof usage.input_tokens === "number" ? usage.input_tokens : 0;
    const completion: number = typeof usage.output_tokens === "number" ? usage.output_tokens : 0;
    const total: number = typeof usage.total_tokens === "number" ? usage.total_tokens : prompt + completion;

    return { prompt_tokens: prompt, completion_tokens: completion, total_tokens: total };
}
