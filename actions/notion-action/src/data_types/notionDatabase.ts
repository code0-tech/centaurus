import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { NotionRichTextSchema } from "./notionRichText.js";
import { NotionUserSchema } from "./notionUser.js";

/**
 * A Notion database. See https://developers.notion.com/reference/database
 */
export const NotionDatabaseSchema = z.object({
    object: z.literal("database"),
    id: z.string(),
    created_time: z.string().optional(),
    last_edited_time: z.string().optional(),
    created_by: NotionUserSchema.optional(),
    last_edited_by: NotionUserSchema.optional(),
    title: z.array(NotionRichTextSchema).optional(),
    description: z.array(NotionRichTextSchema).optional(),
    icon: z.record(z.string(), z.any()).nullable().optional(),
    cover: z.record(z.string(), z.any()).nullable().optional(),
    parent: z.record(z.string(), z.any()).optional(),
    properties: z.record(z.string(), z.any()).optional(),
    url: z.string().optional(),
    public_url: z.string().nullable().optional(),
    archived: z.boolean().optional(),
    in_trash: z.boolean().optional(),
    is_inline: z.boolean().optional(),
});
export type NotionDatabase = z.infer<typeof NotionDatabaseSchema>;

@Identifier("NOTION_DATABASE")
@Name({ code: "en-US", content: "Notion database" })
@DisplayMessage({ code: "en-US", content: "Notion database ${id}" })
@Schema(NotionDatabaseSchema)
export class NotionDatabaseDataType {}
