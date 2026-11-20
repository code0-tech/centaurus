import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import { SlackBlock, SlackTextObject } from "../../data_types/slackBlock.js";

@Identifier("slackCreateBlock")
@DisplayIcon("simple:slack")
@Signature("(type: TEXT, text?: TEXT, fields?: LIST<TEXT>, imageUrl?: TEXT, altText?: TEXT, blockId?: TEXT): SLACK_BLOCK")
@Name({ code: "en-US", content: "Create Slack block" })
@DisplayMessage({ code: "en-US", content: "Create Slack ${type} block" })
@Documentation({
    code: "en-US",
    content:
        "Creates a Block Kit block (`SLACK_BLOCK`) of any type, for the blocks `slackCreateTextSection` does not cover.\nOnly the arguments a block type actually uses are included: `divider` needs none, `header` and `section` take `text`, `section` can take up to 10 `fields` rendered as a two column layout, and `image` takes `imageUrl` plus `altText`. All text is rendered as Slack markdown, except in `header` blocks, which Slack renders literally.",
})
@Description({ code: "en-US", content: "Creates a Slack Block Kit block of a given type." })
@Parameter({
    runtimeName: "type",
    name: [{ code: "en-US", content: "Type" }],
    description: [{ code: "en-US", content: "The block type, e.g. section, divider, header, image or context." }],
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
    description: [{ code: "en-US", content: "Up to 10 texts rendered as a two column layout. Used by section blocks." }],
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
    run(
        _context: unknown,
        type: string,
        text?: string,
        fields?: string[],
        imageUrl?: string,
        altText?: string,
        blockId?: string
    ): SlackBlock {
        // Slack renders header blocks literally and rejects a mrkdwn text object there.
        const textType: SlackTextObject["type"] = type === "header" ? "plain_text" : "mrkdwn";

        return {
            type,
            block_id: blockId,
            text: text !== undefined ? { type: textType, text } : undefined,
            fields: fields && fields.length > 0 ? fields.map((field) => ({ type: textType, text: field })) : undefined,
            image_url: imageUrl,
            alt_text: altText,
        };
    }
}
