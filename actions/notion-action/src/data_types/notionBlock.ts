import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { NotionUserSchema } from "./notionUser.js";

/**
 * A Notion block. The type-specific payload (e.g. `paragraph`, `heading_1`,
 * `to_do`) is kept verbatim under its type key.
 * See https://developers.notion.com/reference/block
 */
export const NotionBlockSchema = z
    .object({
        object: z.literal("block").optional(),
        id: z.string().optional(),
        type: z.string().optional(),
        created_time: z.string().optional(),
        last_edited_time: z.string().optional(),
        created_by: NotionUserSchema.optional(),
        last_edited_by: NotionUserSchema.optional(),
        parent: z.record(z.string(), z.any()).optional(),
        has_children: z.boolean().optional(),
        archived: z.boolean().optional(),
        in_trash: z.boolean().optional(),
    })
    .catchall(z.any());
export type NotionBlock = z.infer<typeof NotionBlockSchema>;

@Identifier("NOTION_BLOCK")
@Name({ code: "en-US", content: "Notion block" })
@DisplayMessage({ code: "en-US", content: "Notion block" })
@Schema(NotionBlockSchema)
export class NotionBlockDataType {}
