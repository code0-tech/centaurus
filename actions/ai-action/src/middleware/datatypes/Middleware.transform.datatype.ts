import type { AiAgentState } from "./Middleware.agentState.datatype.js";
import type { AiStateUpdate } from "./Middleware.stateUpdate.datatype.js";

export type AiMiddlewareTransform = (state: AiAgentState) => Promise<AiStateUpdate>;
