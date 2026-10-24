import type { AiAgentRequest } from "./Agent.request.datatype.js";
import type { AiAgentResponse } from "./Agent.response.datatype.js";

export type AiAgentTransform = (request: AiAgentRequest) => Promise<AiAgentResponse>;
