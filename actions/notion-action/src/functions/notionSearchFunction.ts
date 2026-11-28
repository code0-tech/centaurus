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
@Parameter({ runtimeName: "query", name: [{ code: "en-US", content: "Search text" }], description: [{ code: "en-US", content: "Text to search for in page and database titles. Leave empty to list everything the integration can access." }] })
@Parameter({ runtimeName: "filter", name: [{ code: "en-US", content: "Filter" }], description: [{ code: "en-US", content: "Optionally return only pages or only databases: { property: \"object\", value: \"page\" } or { property: \"object\", value: \"data_source\" }." }], optional: true })
export class NotionSearchFunction {
    run(_context: FunctionContext, integrationToken: string, query: string, filter?: NotionSearchFilter | null) {
        return new NotionClient(integrationToken).search(query, filter);
    }
}

