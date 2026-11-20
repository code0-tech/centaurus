import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * A single Notion rich text object as used in titles, text properties, and
 * block content. See https://developers.notion.com/reference/rich-text
 */
export const NotionRichTextSchema = z.object({
    type: z.enum(["text", "mention", "equation"]).optional(),
    text: z
        .object({
            content: z.string(),
            link: z.object({ url: z.string() }).nullable().optional(),
        })
        .optional(),
    annotations: z
        .object({
            bold: z.boolean().optional(),
            italic: z.boolean().optional(),
            strikethrough: z.boolean().optional(),
            underline: z.boolean().optional(),
            code: z.boolean().optional(),
            color: z.string().optional(),
        })
        .optional(),
    plain_text: z.string().optional(),
    href: z.string().nullable().optional(),
});
export type NotionRichText = z.infer<typeof NotionRichTextSchema>;

@Identifier("NOTION_RICH_TEXT")
@Name({ code: "en-US", content: "Notion rich text" })
@DisplayMessage({ code: "en-US", content: "Notion rich text" })
@Schema(NotionRichTextSchema)
export class NotionRichTextDataType {}
