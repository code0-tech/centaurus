import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { SlackBlock, SlackTextObject } from "../../data_types/slackBlock.js"
import { withoutUndefined } from "../../helpers.js"

// Offered as a select in the flow editor.
export const BLOCK_TYPES = ["section", "header", "divider", "image", "context"] as const
export type BlockType = (typeof BLOCK_TYPES)[number]

@Identifier("slackCreateBlock")
@DisplayIcon("tabler:brand-slack")
@Signature(`(type: ${BLOCK_TYPES.map((type) => `"${type}"`).join(" | ")}, text?: TEXT, fields?: LIST<TEXT>, imageUrl?: TEXT, altText?: TEXT, blockId?: TEXT): SLACK_BLOCK`)
@Name({ code: "en-US", content: "Create Slack block" })
@DisplayMessage({ code: "en-US", content: "Create Slack ${type} block" })
@Documentation({
    code: "en-US",
    content:
        "Creates a `section`, `header`, `divider`, `image` or `context` Block Kit block (`SLACK_BLOCK`), for the blocks `slackCreateTextSection` does not cover.\nOnly the arguments a block type actually uses are included, the rest is ignored: `divider` needs none, `header` and `section` take `text`, `section` can take up to 10 `fields` rendered as a two column layout, `context` renders `text` and `fields` as small grey text elements, and `image` takes `imageUrl` plus `altText`. All text is rendered as Slack markdown, except in `header` blocks, which Slack renders literally.",
})
@Description({ code: "en-US", content: "Creates a Slack Block Kit block of a given type." })
@Parameter({
    runtimeName: "type",
    name: [{ code: "en-US", content: "Type" }],
    description: [{ code: "en-US", content: "The block type: section, header, divider, image or context." }],
})
@Parameter({
    runtimeName: "text",
    name: [{ code: "en-US", content: "Text" }],
    description: [{ code: "en-US", content: "The block's primary text. Used by section, header and context blocks." }],
    optional: true,
})
@Parameter({
    runtimeName: "fields",
    name: [{ code: "en-US", content: "Fields" }],
    description: [{ code: "en-US", content: "Up to 10 texts rendered as a two column layout in section blocks, or as additional elements in context blocks." }],
    optional: true,
})
@Parameter({
    runtimeName: "imageUrl",
    name: [{ code: "en-US", content: "Image URL" }],
    description: [{ code: "en-US", content: "The URL of the image to display. Used by image blocks." }],
    optional: true,
})
@Parameter({
    runtimeName: "altText",
    name: [{ code: "en-US", content: "Alt text" }],
    description: [{ code: "en-US", content: "A plain text summary of the image, used by assistive technology." }],
    optional: true,
})
@Parameter({
    runtimeName: "blockId",
    name: [{ code: "en-US", content: "Block ID" }],
    description: [{ code: "en-US", content: "A unique identifier for the block, echoed back in interaction payloads." }],
    optional: true,
})
export class CreateBlockFunction {
    run(_context: unknown, type: string, text?: string, fields?: string[], imageUrl?: string, altText?: string, blockId?: string): SlackBlock {
        // Flows may pass unset optional arguments as null or an empty string.
        const given = (value?: string | null) => (value ? value : undefined)
        const texts = (fields ?? []).filter((field): field is string => !!field)
        const mainText = given(text)
        const base = { type, block_id: given(blockId) }

        // Slack rejects every property a block type does not define (e.g. `text`
        // on a divider), so each known type only gets the arguments it uses.
        switch (type) {
            case "divider":
                return withoutUndefined(base)
            case "header":
                // Slack renders header blocks literally and rejects mrkdwn there.
                return withoutUndefined({
                    ...base,
                    text: mainText !== undefined ? { type: "plain_text", text: mainText } : undefined,
                })
            case "image":
                return withoutUndefined({ ...base, image_url: given(imageUrl), alt_text: given(altText) })
            case "context":
                // Context blocks have no text field: their texts are a list of elements.
                return withoutUndefined({
                    ...base,
                    elements: [...(mainText !== undefined ? [mainText] : []), ...texts].map((entry) => ({
                        type: "mrkdwn" as const,
                        text: entry,
                    })),
                })
        }

        const textType: SlackTextObject["type"] = "mrkdwn"
        return withoutUndefined({
            ...base,
            text: mainText !== undefined ? { type: textType, text: mainText } : undefined,
            fields: texts.length > 0 ? texts.map((field) => ({ type: textType, text: field })) : undefined,
            image_url: given(imageUrl),
            alt_text: given(altText),
        })
    }
}
