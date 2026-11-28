import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient, type SortDirection } from "../client.js";
import { INTEGRATION_TOKEN_PARAMETER } from "../integrationToken.js";
import { databaseIdParameter } from "../parameters.js";
import type { NotionFilter } from "../data_types/notionFilter.js";

@Identifier("notionQueryDatabase")
@Name({ code: "en-US", content: "Query Notion database" })
@Description({ code: "en-US", content: "Query all matching entries, following every pagination cursor. Without a sort column, entries are sorted by creation time (newest first)." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Query Notion database" })
@Signature(`(integrationToken: string, databaseId: string, filter?: NOTION_FILTER, sortProperty?: string, sortDirection?: "ascending" | "descending"): NOTION_QUERY_RESULT`)
@Parameter(INTEGRATION_TOKEN_PARAMETER)
@Parameter(databaseIdParameter("databaseId"))
@Parameter({ runtimeName: "filter", name: [{ code: "en-US", content: "Filter" }], description: [{ code: "en-US", content: "Optional Notion filter, e.g. { property: \"Done\", checkbox: { equals: false } }. Combine conditions with { and: [...] } or { or: [...] }." }], optional: true })
@Parameter({ runtimeName: "sortProperty", name: [{ code: "en-US", content: "Sort by column" }], description: [{ code: "en-US", content: "Name of the column to sort by, e.g. Due." }], optional: true })
@Parameter({ runtimeName: "sortDirection", name: [{ code: "en-US", content: "Sort direction" }], description: [{ code: "en-US", content: "Default: ascending when sorting by a column; without a column, entries are sorted by creation time and the default is descending (newest first)." }], optional: true })
export class NotionQueryDatabaseFunction {
    run(
        _context: FunctionContext, integrationToken: string, databaseId: string, filter?: NotionFilter | null,
        sortProperty?: string | null, sortDirection?: SortDirection | null
    ) {
        return new NotionClient(integrationToken).queryDatabase(databaseId, filter, sortProperty, sortDirection);
    }
}
