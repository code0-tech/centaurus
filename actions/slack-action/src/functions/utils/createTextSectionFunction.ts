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
import { SlackBlock } from "../../data_types/slackBlock.js";

@Identifier("slackCreateTextSection")
@DisplayIcon("simple:slack")
@Signature("(text: TEXT, markdown?: BOOLEAN, blockId?: TEXT): SLACK_BLOCK")
@Name({ code: "en-US", content: "Create Slack text section" })
@DisplayMessage({ code: "en-US", content: "Create Slack text section" })
@Documentation({
    code: "en-US",
    content:
        "Creates a Block Kit `section` block (`SLACK_BLOCK`) holding a single text object — the workhorse block for message bodies.\nBy default the text is rendered as Slack markdown (`mrkdwn`), so `*bold*`, `_italic_`, `<@U123>` mentions and `<https://…|links>` work. Set `markdown` to false to render the text literally.",
})
@Description({ code: "en-US", content: "Creates a Slack Block Kit section block containing text." })
@Parameter({
    runtimeName: "text",
    name: [{ code: "en-US", content: "Text" }],
    description: [{ code: "en-US", content: "The section text. Max 3000 characters." }],
})
@Parameter({
    runtimeName: "markdown",
    name: [{ code: "en-US", content: "Markdown" }],
    description: [
        {
            code: "en-US",
            content: "Whether to render the text as Slack markdown. Defaults to true; set to false to render it literally.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "blockId",
    name: [{ code: "en-US", content: "Block ID" }],
    description: [{ code: "en-US", content: "A unique identifier for the block, echoed back in interaction payloads." }],
    optional: true,
})
export class CreateTextSectionFunction {
    run(_context: unknown, text: string, markdown?: boolean, blockId?: string): SlackBlock {
        return {
            type: "section",
            block_id: blockId,
            text: {
                type: markdown === false ? "plain_text" : "mrkdwn",
                text,
            },
        };
    }
}
