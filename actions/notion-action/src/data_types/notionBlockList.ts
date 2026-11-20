import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { NotionBlockSchema } from "./notionBlock.js";

/**
 * A paginated list of Notion blocks, as returned when appending or listing a
 * block's children. See
 * https://developers.notion.com/reference/patch-block-children
 */
export const NotionBlockListSchema = z.object({
    object: z.literal("list").optional(),
    results: z.array(NotionBlockSchema),
    next_cursor: z.string().nullable().optional(),
    has_more: z.boolean().optional(),
});
export type NotionBlockList = z.infer<typeof NotionBlockListSchema>;

@Identifier("NOTION_BLOCK_LIST")
@Name({ code: "en-US", content: "Notion block list" })
@DisplayMessage({ code: "en-US", content: "Notion block list" })
@Schema(NotionBlockListSchema)
export class NotionBlockListDataType {}
