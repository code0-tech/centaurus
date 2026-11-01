import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { NotionPropertyMapSchema } from "./notionPropertyValue.js";
import { NotionUserSchema } from "./notionUser.js";

/**
 * A Notion page. See https://developers.notion.com/reference/page
 */
export const NotionPageSchema = z.object({
    object: z.literal("page"),
    id: z.string(),
    created_time: z.string().optional(),
    last_edited_time: z.string().optional(),
    created_by: NotionUserSchema.optional(),
    last_edited_by: NotionUserSchema.optional(),
    cover: z.record(z.string(), z.any()).nullable().optional(),
    icon: z.record(z.string(), z.any()).nullable().optional(),
    parent: z.record(z.string(), z.any()).optional(),
    archived: z.boolean().optional(),
    in_trash: z.boolean().optional(),
    properties: NotionPropertyMapSchema.optional(),
    url: z.string().optional(),
    public_url: z.string().nullable().optional(),
});
export type NotionPage = z.infer<typeof NotionPageSchema>;

@Identifier("NOTION_PAGE")
@Name({ code: "en-US", content: "Notion page" })
@DisplayMessage({ code: "en-US", content: "Notion page ${id}" })
@Schema(NotionPageSchema)
export class NotionPageDataType {}
