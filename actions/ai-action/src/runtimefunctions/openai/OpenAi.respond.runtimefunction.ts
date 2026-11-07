import {
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
@Signature("(response: AI_CHAT_RESPONSE): void")
@Name({ code: "en-US", content: "Respond to the OpenAI request" })
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
     */
    run(context: FunctionContext, response: unknown): null {
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
            log.info("nothing is waiting for this execution's answer, so it goes nowhere", { model: answer.model });
        }

        return null;
    }
}
