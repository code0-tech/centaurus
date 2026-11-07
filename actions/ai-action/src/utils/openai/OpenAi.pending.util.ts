import type { AiChatResponse } from "../../datatypes/chat/Chat.response.datatype.js";
import { logger } from "../shared/Log.logger.util.js";

const log = logger("openai");

interface Waiting {
    resolve: (response: AiChatResponse) => void;
    model: string;
}

/**
 * The HTTP requests currently waiting for a flow to answer them, keyed by the
 * execution the flow runs as.
 *
 * The server and `ai::openai::respond` are two halves of one exchange that never meet
 * in code: the server opens a wait before it starts the flow, the node closes it from
 * wherever in that flow it sits. They find each other through the execution id - the
 * server reserves it up front, and a runtime function of that flow is handed the very
 * same id as its `FunctionContext.executionId`, so nothing has to be passed through
 * the flow for them to match.
 */
class PendingResponses {
    private readonly waiting = new Map<string, Waiting>();

    /** Opens a wait and resolves once the flow responds, if it ever does. */
    open(executionId: string, model: string): Promise<AiChatResponse> {
        return new Promise<AiChatResponse>((resolve) => {
            this.waiting.set(executionId, { resolve, model });
            log.debug(`waiting for execution ${executionId} to answer`, { model, waiting: this.waiting.size });
        });
    }

    /** True when the answer was handed to a request that is still waiting for it. */
    settle(executionId: string, response: AiChatResponse): boolean {
        const waiting: Waiting | undefined = this.waiting.get(executionId);
        if (!waiting) return false;

        this.waiting.delete(executionId);
        waiting.resolve(response);
        log.debug(`execution ${executionId} answered its request`, { waiting: this.waiting.size });
        return true;
    }

    /** Drops a wait whose request is gone, so a late answer finds nothing to settle. */
    close(executionId: string): void {
        this.waiting.delete(executionId);
    }

    get size(): number {
        return this.waiting.size;
    }
}

export const pendingResponses = new PendingResponses();
