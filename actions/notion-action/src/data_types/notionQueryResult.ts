import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { NotionPageSchema } from "./notionPage.js";

/**
 * The result of querying a database: a paginated list of pages.
 * See https://developers.notion.com/reference/post-database-query
 */
export const NotionQueryResultSchema = z.object({
    object: z.literal("list").optional(),
    results: z.array(NotionPageSchema),
    next_cursor: z.string().nullable().optional(),
    has_more: z.boolean().optional(),
});
export type NotionQueryResult = z.infer<typeof NotionQueryResultSchema>;

@Identifier("NOTION_QUERY_RESULT")
@Name({ code: "en-US", content: "Notion query result" })
@DisplayMessage({ code: "en-US", content: "Notion query result" })
@Schema(NotionQueryResultSchema)
export class NotionQueryResultDataType {}
