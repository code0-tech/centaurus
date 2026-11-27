import type { AiChatResponse } from "../../datatypes/chat/Chat.response.datatype.js";

/**
 * A finished answer as the chunks a streaming client expects.
 *
 * A flow answers in one piece - it runs an agent to the end before it returns - so
 * there is nothing to stream token by token. Clients still ask for `stream: true` by
 * default (Open WebUI does), and a client that asked for a stream cannot read a plain
 * body, so the answer is sent as the two chunks of a stream that happens to arrive at
 * once: the content, then the end.
 */
export function toStreamChunks(response: AiChatResponse): string[] {
    const head = {
        id: response.id,
        object: "chat.completion.chunk",
        created: response.created,
        model: response.model,
    };
    const content: string = response.response;
    const toolCalls = response.choices[0]?.message.tool_calls;

    return [
        JSON.stringify({
            ...head,
            choices: [
                {
                    index: 0,
                    delta: { role: "assistant", content, ...(toolCalls ? { tool_calls: toolCalls } : {}) },
                    finish_reason: null,
                },
            ],
            // What the agent did travels with the stream too, so a client that reads
            // these fields is not worse off for having asked for a stream.
            ...(response.steps ? { steps: response.steps } : {}),
            ...(response.awaiting_approval ? { awaiting_approval: response.awaiting_approval } : {}),
        }),
        JSON.stringify({
            ...head,
            choices: [{ index: 0, delta: {}, finish_reason: response.choices[0]?.finish_reason ?? "stop" }],
            ...(response.usage ? { usage: response.usage } : {}),
        }),
        "[DONE]",
    ];
}
