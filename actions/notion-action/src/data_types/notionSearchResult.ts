import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { NotionDatabaseSchema } from "./notionDatabase.js";
import { NotionPageSchema } from "./notionPage.js";

/**
 * The result of a workspace search: a paginated list whose items are pages or
 * databases. See https://developers.notion.com/reference/post-search
 */
export const NotionSearchResultSchema = z.object({
    object: z.literal("list").optional(),
    results: z.array(z.discriminatedUnion("object", [NotionPageSchema, NotionDatabaseSchema])),
    next_cursor: z.string().nullable().optional(),
    has_more: z.boolean().optional(),
});
export type NotionSearchResult = z.infer<typeof NotionSearchResultSchema>;

@Identifier("NOTION_SEARCH_RESULT")
@Name({ code: "en-US", content: "Notion search result" })
@DisplayMessage({ code: "en-US", content: "Notion search result" })
@Schema(NotionSearchResultSchema)
export class NotionSearchResultDataType {}
