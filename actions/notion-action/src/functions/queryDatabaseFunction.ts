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
import { queryDatabase } from "../helpers.js";
import { NotionQueryResult } from "../data_types/notionQueryResult.js";

@Identifier("notionQueryDatabase")
@DisplayIcon("tabler:database-search")
@Signature(
    "(DatabaseId: string, Filter?: NOTION_PROPERTY_VALUE, Sorts?: NOTION_PROPERTY_VALUE[]): NOTION_QUERY_RESULT"
)
@Name({ code: "en-US", content: "Query database" })
@DisplayMessage({ code: "en-US", content: "Query database ${DatabaseId}" })
@Documentation({
    code: "en-US",
    content:
        "Queries a Notion database and returns the matching pages.\n`Filter` is a Notion filter object and `Sorts` a list of Notion sort objects; both are optional. See https://developers.notion.com/reference/post-database-query",
})
@Description({ code: "en-US", content: "Queries a Notion database for matching pages." })
@Parameter({
    runtimeName: "DatabaseId",
    name: [{ code: "en-US", content: "Database ID" }],
    description: [{ code: "en-US", content: "The ID of the database to query." }],
})
@Parameter({
    runtimeName: "Filter",
    name: [{ code: "en-US", content: "Filter" }],
    description: [{ code: "en-US", content: "An optional Notion filter object limiting the returned pages." }],
    optional: true,
})
@Parameter({
    runtimeName: "Sorts",
    name: [{ code: "en-US", content: "Sorts" }],
    description: [{ code: "en-US", content: "An optional list of Notion sort objects ordering the results." }],
    optional: true,
})
export class QueryDatabaseFunction {
    async run(
        context: FunctionContext,
        DatabaseId: string,
        Filter?: Record<string, unknown>,
        Sorts?: Record<string, unknown>[]
    ): Promise<NotionQueryResult> {
        try {
            return await queryDatabase({ databaseId: DatabaseId, filter: Filter, sorts: Sorts }, context);
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            throw new RuntimeError(
                "ERROR_QUERYING_NOTION_DATABASE",
                error instanceof Error ? error.message : "An error occurred while querying the Notion database."
            );
        }
    }
}
