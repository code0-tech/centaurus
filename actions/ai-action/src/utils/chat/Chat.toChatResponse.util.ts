import { randomUUID } from "node:crypto";
import type { AiAgentApproval } from "../../datatypes/agent/Agent.approval.datatype.js";
import type { AiAgentStep } from "../../datatypes/agent/Agent.step.datatype.js";
import type { AiMessage } from "../../datatypes/message/Message.datatype.js";
import type { AiChatMessage } from "../../datatypes/chat/Chat.message.datatype.js";
import type { AiChatResponse } from "../../datatypes/chat/Chat.response.datatype.js";
import type { AiChatUsage } from "../../datatypes/chat/Chat.usage.datatype.js";
import { toChatContent } from "./Chat.toChatContent.util.js";
import { toChatMessage } from "./Chat.toChatMessage.util.js";

export function toChatResponse(
    answer: AiMessage,
    fallbackModel: string,
    structuredResponse?: Record<string, unknown>,
    extras: { steps?: AiAgentStep[]; awaitingApproval?: AiAgentApproval[] } = {},
): AiChatResponse {
    const message: AiChatMessage = toChatMessage(answer);

    // What the provider counted, if it counted anything: a total it did not report is
    // the two halves added up, and a model that reported neither has no usage at all.
    const counted = answer.usage_metadata;
    const prompt: number = typeof counted?.input_tokens === "number" ? counted.input_tokens : 0;
    const completion: number = typeof counted?.output_tokens === "number" ? counted.output_tokens : 0;
    const usage: AiChatUsage | undefined = counted
        ? {
              prompt_tokens: prompt,
              completion_tokens: completion,
              total_tokens: typeof counted.total_tokens === "number" ? counted.total_tokens : prompt + completion,
          }
        : undefined;

    // What the model thought before it answered, if it reported anything: reasoning
    // arrives as its own kind of block, under whichever key the provider chose.
    const reasoning: string = answer.content
        .filter((block) => block.type === "reasoning" || block.type === "thinking")
        .map((block) => {
            const thought: unknown = block.reasoning ?? block.thinking ?? block.text;
            return typeof thought === "string" ? thought : "";
        })
        .join("");

    // The model that actually answered, under whichever key the provider put it; the
    // flow's own name stands in when it named none.
    const metadata: Record<string, unknown> = answer.response_metadata ?? {};

    return {
        id: answer.id ?? `chatcmpl-${randomUUID()}`,
        object: "chat.completion",
        response: toChatContent(answer),
        ...(reasoning.length > 0 ? { reasoning } : {}),
        created: Math.floor(Date.now() / 1000),
        model:
            typeof metadata.model_name === "string"
                ? metadata.model_name
                : typeof metadata.model === "string"
                  ? metadata.model
                  : fallbackModel,
        choices: [{ index: 0, message, finish_reason: message.tool_calls ? "tool_calls" : "stop" }],
        ...(usage ? { usage } : {}),
        ...(structuredResponse ? { structured_response: structuredResponse } : {}),
        ...(extras.steps?.length ? { steps: extras.steps } : {}),
        ...(extras.awaitingApproval?.length ? { awaiting_approval: extras.awaitingApproval } : {}),
    };
}
