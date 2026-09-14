import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import type { NotionSearchFilter } from "../data_types/notionSearchFilter.js";

@Identifier("notionSearch")
@Name({ code: "en-US", content: "Search Notion" })
@Description({ code: "en-US", content: "Search accessible page and database titles, following every pagination cursor." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Search Notion" })
@Signature("(query: string, filter?: NOTION_SEARCH_FILTER): NOTION_SEARCH_RESULT")
@Parameter({ runtimeName: "query", name: [{ code: "en-US", content: "query" }], description: [{ code: "en-US", content: "Title search text; empty text lists all accessible results" }] })
@Parameter({ runtimeName: "filter", name: [{ code: "en-US", content: "filter" }], description: [{ code: "en-US", content: "Optionally restrict to page or database objects" }] })
export class NotionSearchFunction {
    run(context: FunctionContext, query: string, filter?: NotionSearchFilter) {
        return new NotionClient(context.matchedConfig).search(query, filter);
    }
}

