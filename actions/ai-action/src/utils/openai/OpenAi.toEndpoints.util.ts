import type { ActionFlow } from "@code0-tech/tucana/aquila";
import { OPENAI_EVENT, type OpenAiEndpoint } from "../../types/openai/OpenAi.types.js";
import { logger } from "../shared/Log.logger.util.js";
import { normalizeRoute } from "./OpenAi.normalizeRoute.util.js";
import { textSetting } from "./OpenAi.textSetting.util.js";

const log = logger("openai");

/**
 * The endpoints the action currently serves.
 *
 * A flow missing its route or its model name is left out rather than guessed at: the
 * route is what makes it reachable and the model is what a client asks for, so
 * standing in for either would answer under a name nobody picked. It is logged,
 * because a model missing from a client's list is otherwise a silent gap.
 */
export function toEndpoints(flows: ActionFlow[]): OpenAiEndpoint[] {
    return flows
        .filter((flow) => flow.type === OPENAI_EVENT)
        .map((flow): OpenAiEndpoint | undefined => {
            const route: string | undefined = textSetting(flow, "route");
            const model: string | undefined = textSetting(flow, "model");
            const slug: string = flow.projectSlug.trim();

            if (!route || !model || slug.length === 0) {
                log.warn(`flow ${flow.flowId} is bound to the OpenAI endpoint but serves nothing`, {
                    name: flow.name,
                    route: route ?? null,
                    model: model ?? null,
                    project: slug || null,
                });
                return undefined;
            }

            const apiKey: string | undefined = textSetting(flow, "api_key");
            return { flow, slug, route: normalizeRoute(route), model, ...(apiKey ? { apiKey } : {}) };
        })
        .filter((endpoint): endpoint is OpenAiEndpoint => endpoint !== undefined);
}
