import { RuntimeError } from "@code0-tech/hercules";
import { AiWebSearchResultSchema, type AiWebSearchResult } from "../datatypes/WebSearch.result.datatype.js";
import { parseSearchPayload } from "./WebSearch.parseSearchPayload.util.js";

export function toSearchResult(query: string, raw: unknown): AiWebSearchResult {
    const payload: unknown = typeof raw === "string" ? parseSearchPayload(raw) : raw;

    if (payload && typeof payload === "object" && "error" in payload) {
        throw new RuntimeError("ERROR_AI_WEB_SEARCH_FAILED", `The web search failed: ${String(payload.error)}`);
    }

    const source = (payload ?? {}) as { results?: unknown; answer?: unknown };
    const results: unknown[] = Array.isArray(source.results) ? source.results : [];

    return AiWebSearchResultSchema.parse({
        query,
        results: results.map((hit) => {
            const entry = (hit ?? {}) as Record<string, unknown>;
            return {
                title: String(entry.title ?? ""),
                url: String(entry.url ?? ""),
                content: String(entry.content ?? ""),
                ...(typeof entry.score === "number" ? { score: entry.score } : {}),
            };
        }),
        ...(typeof source.answer === "string" && source.answer.length > 0 ? { answer: source.answer } : {}),
    });
}
