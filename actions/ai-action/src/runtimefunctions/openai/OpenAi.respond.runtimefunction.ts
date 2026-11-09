import {
    Description,
    DisplayIcon,
    DisplayMessage,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    Signature,
    ThrowsError,
} from "@code0-tech/hercules";
import { AiChatResponseSchema, type AiChatResponse } from "../../datatypes/chat/Chat.response.datatype.js";
import { logger } from "../../utils/shared/Log.logger.util.js";
import { parseOrThrow } from "../../utils/shared/Shared.parseOrThrow.util.js";
import { pendingResponses } from "../../utils/openai/OpenAi.pending.util.js";

@Identifier("ai::openai::respond")
@DisplayIcon("tabler:ai")
@Signature("(response: AI_CHAT_RESPONSE): AI_CHAT_RESPONSE")
@Name({ code: "en-US", content: "Respond to the OpenAI request" })
@Description({
    code: "en-US",
    content:
        "Answers the waiting OpenAI client with this response, from wherever in the flow it belongs, so the flow can go on afterwards without the client waiting. It is also this node's result.",
})
@DisplayMessage({ code: "en-US", content: "Answer the OpenAI request with ${response}" })
@ThrowsError()
@Parameter({
    runtimeName: "response",
    name: [{ code: "en-US", content: "Response" }],
    description: [{ code: "en-US", content: "The answer the client receives, e.g. the one an agent produced." }],
})
export class OpenAiRespondFunction {
    /**
     * Answers the HTTP request an OpenAI client is holding open, from wherever in the
     * flow the node sits.
     *
     * Without it the answer would have to be the flow's return value, which is only
     * the agent's as long as nothing follows it - a flow that logs, stores or branches
     * after the agent would answer with whatever its last node happened to produce.
     *
     * Which request is answered needs no parameter: the endpoint reserved the flow's
     * execution id before starting it, and this node runs as part of that execution,
     * so `executionId` names the waiting request.
     *
     * The request is answered the moment this runs; the flow carries on, and anything
     * after this node no longer changes what the client got. A second call, or a run
     * of a flow nobody is waiting on - a manual execution from the editor, say - is
     * logged rather than failed: the flow did nothing wrong, there is simply no
     * connection to write to.
     *
     * The answer is returned rather than dropped, so it is the node's result and, for
     * the last node of a flow, the flow's. That is what a manual execution has to go
     * on: there is no connection to deliver to, and a void node would leave such a run
     * ending in nothing. For an HTTP request it changes nothing - the server takes the
     * answer from the wait this settles and ignores the flow's result.
     */
    run(context: FunctionContext, response: unknown): AiChatResponse {
        const log = logger("openai", context.executionId);
        const answer: AiChatResponse = parseOrThrow(
            AiChatResponseSchema,
            response,
            "ERROR_INVALID_AI_OPENAI_RESPONSE",
            "The answer for an OpenAI client has to be a chat response",
        );

        if (pendingResponses.settle(context.executionId, answer)) {
            log.info("answered the waiting OpenAI request", { model: answer.model });
        } else {
            log.info("nothing is waiting for this execution's answer, so it stays this node's result", {
                model: answer.model,
            });
        }

        return answer;
    }
}
