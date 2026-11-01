import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * A Block Kit composition object holding text, either as Slack markdown
 * (`mrkdwn`) or as literal text (`plain_text`).
 * See https://docs.slack.dev/reference/block-kit/composition-objects/text-object
 */
export const SlackTextObjectSchema = z.object({
    type: z.enum(["mrkdwn", "plain_text"]).describe("How the text is rendered: mrkdwn for Slack markdown, plain_text for literal text."),
    text: z.string().max(3000).describe("The text content. Max 3000 characters."),
    emoji: z.boolean().nullish().describe("Whether to escape emoji into their colon form. Only valid for plain_text."),
    verbatim: z.boolean().nullish().describe("Whether to skip auto-linking of URLs and channel names. Only valid for mrkdwn."),
});
export type SlackTextObject = z.infer<typeof SlackTextObjectSchema>;

/**
 * A single Block Kit block. Slack defines a large, growing set of block types,
 * so only the fields shared by the common ones are typed; anything else can be
 * passed through `accessory` and `elements`.
 * See https://docs.slack.dev/reference/block-kit/blocks
 */
export const SlackBlockSchema = z.object({
    type: z.string().describe("The block type, e.g. section, divider, header, image, actions or context."),
    block_id: z.string().max(255).nullish().describe("A unique identifier for the block, echoed back in interaction payloads."),
    text: SlackTextObjectSchema.nullish().describe("The block's primary text object. Used by section and header blocks."),
    fields: z.array(SlackTextObjectSchema).max(10).nullish().describe("Up to 10 text objects rendered as a two column layout. Used by section blocks."),
    accessory: z.unknown().nullish().describe("An interactive element rendered next to the block's text, as a raw Block Kit element object."),
    elements: z.array(z.unknown()).nullish().describe("The block's interactive or context elements, as raw Block Kit element objects."),
    image_url: z.string().nullish().describe("The URL of the image to display. Used by image blocks."),
    alt_text: z.string().nullish().describe("A plain text summary of the image, used by assistive technology."),
});
export type SlackBlock = z.infer<typeof SlackBlockSchema>;

@Identifier("SLACK_BLOCK")
@Name({ code: "en-US", content: "Slack block" })
@DisplayMessage({ code: "en-US", content: "Slack block" })
@Schema(SlackBlockSchema)
export class SlackBlockDataType {}
