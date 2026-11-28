import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import { INTEGRATION_TOKEN_PARAMETER } from "../integrationToken.js";
import { databaseIdParameter } from "../parameters.js";
import type { NotionFilter } from "../data_types/notionFilter.js";
import type { NotionSort } from "../data_types/notionSort.js";

@Identifier("notionQueryDatabase")
@Name({ code: "en-US", content: "Query Notion database" })
@Description({ code: "en-US", content: "Query all matching entries, following every pagination cursor. Without a sort, entries come newest first (by creation time)." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Query Notion database" })
@Signature("(integrationToken: string, databaseId: string, filter?: NOTION_FILTER, sort?: NOTION_SORT): NOTION_QUERY_RESULT")
@Parameter(INTEGRATION_TOKEN_PARAMETER)
@Parameter(databaseIdParameter("databaseId"))
@Parameter({ runtimeName: "filter", name: [{ code: "en-US", content: "Filter" }], description: [{ code: "en-US", content: "Optional Notion filter, e.g. { property: \"Done\", checkbox: { equals: false } }. Combine conditions with { and: [...] } or { or: [...] }." }], optional: true })
@Parameter({ runtimeName: "sort", name: [{ code: "en-US", content: "Sort" }], description: [{ code: "en-US", content: "Optional column to sort by, e.g. { property: \"Due\", direction: \"ascending\" }. Without a sort, entries come newest first." }], optional: true })
export class NotionQueryDatabaseFunction {
    run(_context: FunctionContext, integrationToken: string, databaseId: string, filter?: NotionFilter | null, sort?: NotionSort | null) {
        return new NotionClient(integrationToken).queryDatabase(databaseId, filter, sort);
    }
}
