import type { OpenAiEndpoint, OpenAiModel, OpenAiModelList } from "../../types/openai/OpenAi.types.js";

/**
 * The answer to `GET /models`: the flows serving this route, by the model name each
 * one carries. A client asks for this before it sends a message - Open WebUI lists
 * what it finds here and treats a failure as a broken connection - and the list is
 * built from the flows themselves, so adding a flow adds a model with nothing else
 * to configure.
 */
export function toModelList(endpoints: OpenAiEndpoint[]): OpenAiModelList {
    const created: number = Math.floor(Date.now() / 1000);
    const seen = new Set<string>();
    const data: OpenAiModel[] = [];

    for (const endpoint of endpoints) {
        if (seen.has(endpoint.model)) continue;
        seen.add(endpoint.model);
        data.push({ id: endpoint.model, object: "model", created, owned_by: endpoint.slug });
    }

    return { object: "list", data };
}
