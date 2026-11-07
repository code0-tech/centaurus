import type { OpenAiEndpointKind, OpenAiRequestPath } from "../../types/openai/OpenAi.types.js";
import { normalizeRoute } from "./OpenAi.normalizeRoute.util.js";

const ENDPOINTS: Record<string, OpenAiEndpointKind> = {
    "/chat/completions": "chat_completions",
    "/models": "models",
};

/**
 * Splits a request path into the project, the flow's route and the endpoint.
 *
 * A client is configured with a base URL and appends the endpoint itself, so the path
 * reads `/<project>/<route>/chat/completions`. The project comes first because a
 * route is only unique inside one: without the slug two projects asking for `/v1`
 * would answer each other's requests.
 */
export function parseRequestPath(path: string): OpenAiRequestPath | undefined {
    const [withoutQuery] = path.split("?");
    const clean: string = normalizeRoute(withoutQuery ?? "");

    const endpoint: [string, OpenAiEndpointKind] | undefined = Object.entries(ENDPOINTS).find(([suffix]) =>
        clean.endsWith(suffix),
    );
    if (!endpoint) return undefined;

    const [suffix, kind] = endpoint;
    const base: string = clean.slice(0, -suffix.length);
    const [slug, ...rest] = base.split("/").filter((segment) => segment.length > 0);
    if (!slug) return undefined;

    return { slug, route: normalizeRoute(rest.join("/")), kind };
}
