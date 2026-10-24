import type { AiModelRequest } from "./Model.request.datatype.js";
import type { AiModelResponse } from "./Model.response.datatype.js";

export type AiModelTransform = (request: AiModelRequest) => Promise<AiModelResponse>;
