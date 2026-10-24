import {
    DisplayIcon,
    DisplayMessage,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
    ThrowsError,
} from "@code0-tech/hercules";
import type { AiAgentTransform } from "../datatypes/Agent.transform.datatype.js";
import { AiAgentResponseSchema, type AiAgentResponse } from "../datatypes/Agent.response.datatype.js";
import type { AiChatResponse } from "../../chat/datatypes/Chat.response.datatype.js";
import { AiChatRequestSchema, type AiChatRequest } from "../../chat/datatypes/Chat.request.datatype.js";
import type { AiMessage } from "../../message/datatypes/Message.datatype.js";
import { asText } from "../../shared/utils/Shared.asText.util.js";
import { isSubFlow } from "../../shared/utils/Shared.isSubFlow.util.js";
import { parseOrThrow } from "../../shared/utils/Shared.parseOrThrow.util.js";
import { toChatResponse } from "../../chat/utils/Chat.toChatResponse.util.js";
import { toConversation } from "../../chat/utils/Chat.toConversation.util.js";

@Identifier("ai::agent::invoke")
@DisplayIcon("tabler:message-chatbot")
@Signature(
    "(agent: TRANSFORM<AI_AGENT_REQUEST, AI_AGENT_RESPONSE>, prompt: TEXT, request?: AI_CHAT_REQUEST): AI_CHAT_RESPONSE",
)
@Name({ code: "en-US", content: "Invoke agent" })
@DisplayMessage({ code: "en-US", content: "Ask the agent ${prompt}" })
@ThrowsError()
@Parameter({
    runtimeName: "agent",
    name: [{ code: "en-US", content: "Agent" }],
})
@Parameter({
    runtimeName: "prompt",
    name: [{ code: "en-US", content: "Prompt" }],
})
@Parameter({
    runtimeName: "request",
    name: [{ code: "en-US", content: "Request" }],
    optional: true,
})
export class InvokeAgentFunction {
    async run(
        _context: FunctionContext,
        agent: AiAgentTransform,
        prompt: string,
        request?: AiChatRequest,
    ): Promise<AiChatResponse> {
        if (!isSubFlow(agent)) {
            throw new RuntimeError(
                "ERROR_INVALID_AI_AGENT",
                `The "agent" parameter has to be an agent as "ai::agent::create" returns one, but a ${typeof agent} was passed.`,
            );
        }

        const parsed: AiChatRequest = parseOrThrow(
            AiChatRequestSchema,
            request ?? { messages: [] },
            "ERROR_INVALID_AI_CHAT_REQUEST",
            "The chat request is not valid",
        );
        const messages: AiMessage[] = toConversation(
            parsed.messages,
            asText(prompt, "prompt", "ERROR_INVALID_AI_CHAT_REQUEST"),
        );
        if (messages.length === 0) {
            throw new RuntimeError(
                "ERROR_INVALID_AI_CHAT_REQUEST",
                "There is nothing to ask: the prompt is empty and the request carries no messages.",
            );
        }

        const answer: AiAgentResponse = parseOrThrow(
            AiAgentResponseSchema,
            (await agent({ messages })) ?? {},
            "ERROR_INVALID_AI_AGENT_RESPONSE",
            "The agent did not answer with a valid agent response",
        );

        const last: AiMessage | undefined = answer.messages.at(-1);
        if (!last) {
            throw new RuntimeError("ERROR_INVALID_AI_AGENT_RESPONSE", "The agent answered with an empty conversation.");
        }

        return toChatResponse(last, parsed.model ?? "");
    }
}
