import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import { getSlackClient, toBlockArgument, toRuntimeError } from "../helpers.js";
import { SlackBlock } from "../data_types/slackBlock.js";
import { SlackMessage, SlackMessageSchema } from "../data_types/slackMessage.js";

@Identifier("slackPostMessage")
@DisplayIcon("simple:slack")
@Signature("(channelId: TEXT, text: TEXT, blocks?: LIST<SLACK_BLOCK>): SLACK_MESSAGE")
@Name({ code: "en-US", content: "Post message" })
@DisplayMessage({ code: "en-US", content: "Post Slack message to ${channelId}" })
@Documentation({
    code: "en-US",
    content:
        "Posts a message to a Slack channel, private group or DM via `chat.postMessage`.\nThe bot must be a member of the channel. `text` is also used as the notification and accessibility fallback when `blocks` are provided.",
})
@Description({ code: "en-US", content: "Posts a message to a Slack channel." })
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel, private group or DM to post to (e.g. C0123456789)." }],
})
@Parameter({
    runtimeName: "text",
    name: [{ code: "en-US", content: "Text" }],
    description: [
        {
            code: "en-US",
            content: "The message text. Used as the notification and accessibility fallback when blocks are provided.",
        },
    ],
})
@Parameter({
    runtimeName: "blocks",
    name: [{ code: "en-US", content: "Blocks" }],
    description: [{ code: "en-US", content: "Block Kit blocks making up the message body. Build them with slackCreateTextSection or slackCreateBlock." }],
    optional: true,
})
export class PostMessageFunction {
    async run(context: FunctionContext, channelId: string, text: string, blocks?: SlackBlock[]): Promise<SlackMessage> {
        const client = getSlackClient(context);
        try {
            const result = await client.chat.postMessage({
                channel: channelId,
                text,
                ...toBlockArgument(blocks),
            });
            return SlackMessageSchema.parse({ ...result.message, ok: result.ok, channel: result.channel, ts: result.ts });
        } catch (error) {
            throw toRuntimeError("SLACK_POST_MESSAGE_FAILED", error);
        }
    }
}
