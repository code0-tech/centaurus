import type { SubFlowFunctionDefinition } from "@code0-tech/hercules";
import type { AiAgentRequest } from "./Agent.request.datatype.js";
import type { AiAgentResponse } from "./Agent.response.datatype.js";

/**
 * An agent returned from a runtime function. Hercules only turns a returned value
 * into a sub flow the flow can invoke when it is a {@link SubFlowFunctionDefinition};
 * a bare closure reaches the value serializer and is rejected as an unsupported type.
 */
export interface AiAgentTransform extends SubFlowFunctionDefinition<AiAgentResponse> {
    run(request: AiAgentRequest): Promise<AiAgentResponse>;
}
