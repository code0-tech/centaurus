import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { search } from "../helpers.js";
import { NotionSearchResult } from "../data_types/notionSearchResult.js";

@Identifier("notionSearch")
@DisplayIcon("tabler:search")
@Signature("(Query: string, Filter?: NOTION_PROPERTY_VALUE): NOTION_SEARCH_RESULT")
@Name({ code: "en-US", content: "Search" })
@DisplayMessage({ code: "en-US", content: "Search Notion for ${Query}" })
@Documentation({
    code: "en-US",
    content:
        "Searches all pages and databases shared with the integration.\n`Filter` is an optional Notion search filter (e.g. restrict to pages or databases). See https://developers.notion.com/reference/post-search",
})
@Description({ code: "en-US", content: "Searches Notion pages and databases." })
@Parameter({
    runtimeName: "Query",
    name: [{ code: "en-US", content: "Query" }],
    description: [{ code: "en-US", content: "The text to search page and database titles for." }],
})
@Parameter({
    runtimeName: "Filter",
    name: [{ code: "en-US", content: "Filter" }],
    description: [{ code: "en-US", content: "An optional Notion search filter object." }],
    optional: true,
})
export class SearchFunction {
    async run(
        context: FunctionContext,
        Query: string,
        Filter?: Record<string, unknown>
    ): Promise<NotionSearchResult> {
        try {
            return await search({ query: Query, filter: Filter }, context);
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            throw new RuntimeError(
                "ERROR_SEARCHING_NOTION",
                error instanceof Error ? error.message : "An error occurred while searching Notion."
            );
        }
    }
}
