import type { SubFlowFunctionDefinition } from "@code0-tech/hercules";
import type { AiModelRequest } from "./Model.request.datatype.js";
import type { AiModelResponse } from "./Model.response.datatype.js";

/**
 * A model returned from a runtime function. Hercules only turns a returned value into
 * a sub flow the flow can invoke when it is a {@link SubFlowFunctionDefinition}; a
 * bare closure reaches the value serializer and is rejected as an unsupported type.
 */
export interface AiModelTransform extends SubFlowFunctionDefinition<AiModelResponse> {
    run(request: AiModelRequest): Promise<AiModelResponse>;
}
