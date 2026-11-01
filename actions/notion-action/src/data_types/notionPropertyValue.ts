import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * A Notion page property value. Property values are heterogeneous (title,
 * rich_text, number, select, date, checkbox, relation, ...), so only the
 * envelope (`id`/`type`) is modelled and the type-specific payload is kept
 * verbatim. See https://developers.notion.com/reference/page-property-values
 */
export const NotionPropertyValueSchema = z
    .object({
        id: z.string().optional(),
        type: z.string().optional(),
    })
    .catchall(z.any());
export type NotionPropertyValue = z.infer<typeof NotionPropertyValueSchema>;

/** A map of property name to property value, as found on a page's `properties`. */
export const NotionPropertyMapSchema = z.record(z.string(), NotionPropertyValueSchema);
export type NotionPropertyMap = z.infer<typeof NotionPropertyMapSchema>;

@Identifier("NOTION_PROPERTY_VALUE")
@Name({ code: "en-US", content: "Notion property value" })
@DisplayMessage({ code: "en-US", content: "Notion property value" })
@Schema(NotionPropertyValueSchema)
export class NotionPropertyValueDataType {}
