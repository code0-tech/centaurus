import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const SlackEmbedFieldSchema = z.object({
    name: z.string().describe("The field label, shown in bold."),
    value: z.string().describe("The field value. Supports Slack markdown."),
});
export type SlackEmbedField = z.infer<typeof SlackEmbedFieldSchema>;

/**
 * A rich message body, filled in like a form instead of assembling Block Kit
 * blocks by hand. Every part is optional; the action turns what is set into
 * the matching Block Kit blocks (header, section, fields, image, context).
 */
export const SlackEmbedSchema = z.object({
    title: z.string().nullish().describe("A bold heading at the top. Max 150 characters."),
    text: z.string().nullish().describe("The main text. Supports Slack markdown such as *bold*, _italic_ and <https://example.com|links>."),
    fields: z
        .array(SlackEmbedFieldSchema)
        .nullish()
        .describe("Label/value pairs shown in two columns, e.g. Status: Shipped."),
    imageUrl: z.string().nullish().describe("The URL of a large image shown below the text."),
    thumbnailUrl: z.string().nullish().describe("The URL of a small image shown next to the text."),
    footer: z.string().nullish().describe("Small grey text at the bottom."),
});
export type SlackEmbed = z.infer<typeof SlackEmbedSchema>;

@Identifier("SLACK_EMBED_FIELD")
@Name({ code: "en-US", content: "Slack embed field" })
@DisplayMessage({ code: "en-US", content: "Embed field: ${name}" })
@Schema(SlackEmbedFieldSchema)
export class SlackEmbedFieldDataType {}

@Identifier("SLACK_EMBED")
@Name({ code: "en-US", content: "Slack embed" })
@DisplayMessage({ code: "en-US", content: "Slack embed" })
@Schema(SlackEmbedSchema)
export class SlackEmbedDataType {}
