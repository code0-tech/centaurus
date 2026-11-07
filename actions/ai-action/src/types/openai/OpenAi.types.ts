import type { ActionFlow } from "@code0-tech/tucana/aquila";

/** The flow type every flow of an OpenAI endpoint carries. */
export const OPENAI_EVENT = "ai::openai::server";

/** One model a project serves, and the flow behind it. */
export interface OpenAiEndpoint {
    flow: ActionFlow;
    /** The project the flow belongs to, as it appears in the path. */
    slug: string;
    route: string;
    /** The name clients see and pick. */
    model: string;
    /** The bearer token a client has to send, when the flow asked for one. */
    apiKey?: string;
}

export type OpenAiEndpointKind = "chat_completions" | "models";

/** A request path, split into what decides which flow answers it. */
export interface OpenAiRequestPath {
    /** The project, which is the first path segment and what scopes a route. */
    slug: string;
    route: string;
    kind: OpenAiEndpointKind;
}

/** One entry of the answer to `GET /models`. */
export interface OpenAiModel {
    id: string;
    object: "model";
    created: number;
    owned_by: string;
}

/** The answer to `GET /models`. */
export interface OpenAiModelList {
    object: "list";
    data: OpenAiModel[];
}
