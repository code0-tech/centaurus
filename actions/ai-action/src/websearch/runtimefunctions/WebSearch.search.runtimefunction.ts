import {
    DisplayIcon,
    DisplayMessage,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
    ThrowsError,
} from "@code0-tech/hercules";
import { TavilySearch } from "@langchain/tavily";
import type { AiWebSearchResult } from "../datatypes/WebSearch.result.datatype.js";
import { describeError } from "../../shared/utils/Shared.describeError.util.js";
import { requireText } from "../../shared/utils/Shared.requireText.util.js";
import { toSearchResult } from "../utils/WebSearch.toSearchResult.util.js";

type WebSearchTopic = "general" | "news" | "finance";

@Identifier("ai::tool::web_search")
@DisplayIcon("tabler:world-search")
@Signature(
    "(query: TEXT, api_key: TEXT, max_results?: NUMBER, topic?: TEXT, include_answer?: BOOLEAN): AI_WEB_SEARCH_RESULT",
)
@Name({ code: "en-US", content: "Web search" })
@DisplayMessage({ code: "en-US", content: "Search the web for ${query}" })
@ThrowsError()
@Parameter({
    runtimeName: "query",
    name: [{ code: "en-US", content: "Query" }],
})
@Parameter({
    runtimeName: "api_key",
    name: [{ code: "en-US", content: "API key" }],
})
@Parameter({
    runtimeName: "max_results",
    name: [{ code: "en-US", content: "Maximum results" }],
    optional: true,
})
@Parameter({
    runtimeName: "topic",
    name: [{ code: "en-US", content: "Topic" }],
    optional: true,
})
@Parameter({
    runtimeName: "include_answer",
    name: [{ code: "en-US", content: "Include answer" }],
    optional: true,
})
export class WebSearchToolFunction {
    async run(
        _context: FunctionContext,
        query: string,
        api_key: string,
        max_results?: number,
        topic?: WebSearchTopic,
        include_answer?: boolean,
    ): Promise<AiWebSearchResult> {
        const question: string = requireText(query, "ERROR_INVALID_AI_WEB_SEARCH", "A web search needs a query.");
        const search = new TavilySearch({
            tavilyApiKey: requireText(api_key, "ERROR_INVALID_AI_WEB_SEARCH", "A web search needs a Tavily API key."),
            maxResults: max_results ?? 5,
            includeAnswer: include_answer ?? true,
            ...(topic ? { topic } : {}),
        });

        const raw = await search.invoke({ query: question }).catch((error: unknown) => {
            throw new RuntimeError("ERROR_AI_WEB_SEARCH_FAILED", `The web search failed: ${describeError(error)}`);
        });

        return toSearchResult(question, raw);
    }
}
