import { RuntimeError } from "@code0-tech/hercules";

export function parseSearchPayload(value: string): unknown {
    try {
        return JSON.parse(value);
    } catch {
        throw new RuntimeError("ERROR_AI_WEB_SEARCH_FAILED", "The web search returned an unreadable response.");
    }
}
