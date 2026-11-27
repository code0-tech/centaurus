import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import { INTEGRATION_TOKEN_PARAMETER } from "../integrationToken.js";
import type { NotionSearchFilter } from "../data_types/notionSearchFilter.js";

@Identifier("notionSearch")
@Name({ code: "en-US", content: "Search Notion" })
@Description({ code: "en-US", content: "Search accessible page and database titles, following every pagination cursor." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Search Notion" })
@Signature("(integrationToken: string, query: string, filter?: NOTION_SEARCH_FILTER): NOTION_SEARCH_RESULT")
@Parameter(INTEGRATION_TOKEN_PARAMETER)
@Parameter({ runtimeName: "query", name: [{ code: "en-US", content: "query" }], description: [{ code: "en-US", content: "Title search text; empty text lists all accessible results" }] })
@Parameter({ runtimeName: "filter", name: [{ code: "en-US", content: "filter" }], description: [{ code: "en-US", content: "Optionally restrict to page or database objects" }], optional: true })
export class NotionSearchFunction {
    run(_context: FunctionContext, integrationToken: string, query: string, filter?: NotionSearchFilter | null) {
        return new NotionClient(integrationToken).search(query, filter);
    }
}

