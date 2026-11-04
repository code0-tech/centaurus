import type { SubFlowFunctionDefinition } from "@code0-tech/hercules";
import type { AiAgentState } from "./Middleware.agentState.datatype.js";
import type { AiStateUpdate } from "./Middleware.stateUpdate.datatype.js";

/**
 * A middleware returned from a runtime function. Hercules only turns a returned value
 * into a sub flow the flow can invoke when it is a {@link SubFlowFunctionDefinition};
 * a bare closure reaches the value serializer and is rejected as an unsupported type.
 */
export interface AiMiddlewareTransform extends SubFlowFunctionDefinition<AiStateUpdate> {
    run(state: AiAgentState): Promise<AiStateUpdate>;
}
