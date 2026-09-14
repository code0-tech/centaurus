import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import type { NotionFilter } from "../data_types/notionFilter.js";
import type { NotionSort } from "../data_types/notionSort.js";

@Identifier("notionQueryDatabase")
@Name({ code: "en-US", content: "Query Notion database" })
@Description({ code: "en-US", content: "Query all matching entries, following every pagination cursor." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Query Notion database" })
@Signature("(databaseId: string, filter?: NOTION_FILTER, sorts?: NOTION_SORT[]): NOTION_QUERY_RESULT")
@Parameter({ runtimeName: "databaseId", name: [{ code: "en-US", content: "databaseId" }], description: [{ code: "en-US", content: "Database ID" }] })
@Parameter({ runtimeName: "filter", name: [{ code: "en-US", content: "filter" }], description: [{ code: "en-US", content: "Optional Notion filter, including and/or groups" }] })
@Parameter({ runtimeName: "sorts", name: [{ code: "en-US", content: "sorts" }], description: [{ code: "en-US", content: "Optional ordered sorting rules" }] })
export class NotionQueryDatabaseFunction {
    run(context: FunctionContext, databaseId: string, filter?: NotionFilter, sorts?: NotionSort[]) {
        return new NotionClient(context.matchedConfig).queryDatabase(databaseId, filter, sorts);
    }
}

