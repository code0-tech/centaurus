import type { PlainValue } from "@code0-tech/hercules";
import type { ActionFlow } from "@code0-tech/tucana/aquila";

/**
 * What the server needs of the action: the flows it currently knows, the execution a
 * flow is about to run as, and a way to run it.
 *
 * Taking only this much keeps the server testable without a connection to aquila - and
 * the reserved execution is what lets the respond node find the request waiting for it.
 */
export interface OpenAiServerHost {
    flows: () => ActionFlow[];
    reserveExecutionId: () => string;
    executeFlowWithId: (executionId: string, flowId: bigint, payload: PlainValue) => Promise<PlainValue>;
}

export interface OpenAiServerOptions {
    port?: number;
    host?: string;
}

/** An error in the shape an OpenAI client expects. */
export interface OpenAiErrorBody {
    error: { message: string; type: string; code?: string };
}
