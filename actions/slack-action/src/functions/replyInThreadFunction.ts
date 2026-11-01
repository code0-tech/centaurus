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

@Identifier("slackReplyInThread")
@DisplayIcon("simple:slack")
@Signature("(channelId: TEXT, threadTs: TEXT, text: TEXT, blocks?: LIST<SLACK_BLOCK>): SLACK_MESSAGE")
@Name({ code: "en-US", content: "Reply in thread" })
@DisplayMessage({ code: "en-US", content: "Reply in Slack thread ${threadTs}" })
@Documentation({
    code: "en-US",
    content:
        "Posts a message as a threaded reply to an existing message.\n`threadTs` is the `ts` of the parent message — take it from a SlackMessagePosted or SlackAppMentioned event, or from the result of a previous slackPostMessage.",
})
@Description({ code: "en-US", content: "Posts a reply in an existing Slack thread." })
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel holding the parent message." }],
})
@Parameter({
    runtimeName: "threadTs",
    name: [{ code: "en-US", content: "Thread timestamp" }],
    description: [{ code: "en-US", content: "The `ts` of the parent message to reply to." }],
})
@Parameter({
    runtimeName: "text",
    name: [{ code: "en-US", content: "Text" }],
    description: [
        {
            code: "en-US",
            content: "The reply text. Used as the notification and accessibility fallback when blocks are provided.",
        },
    ],
})
@Parameter({
    runtimeName: "blocks",
    name: [{ code: "en-US", content: "Blocks" }],
    description: [{ code: "en-US", content: "Block Kit blocks making up the reply body." }],
    optional: true,
})
export class ReplyInThreadFunction {
    async run(
        context: FunctionContext,
        channelId: string,
        threadTs: string,
        text: string,
        blocks?: SlackBlock[]
    ): Promise<SlackMessage> {
        const client = getSlackClient(context);
        try {
            const result = await client.chat.postMessage({
                channel: channelId,
                thread_ts: threadTs,
                text,
                ...toBlockArgument(blocks),
            });
            return SlackMessageSchema.parse({ ...result.message, ok: result.ok, channel: result.channel, ts: result.ts });
        } catch (error) {
            throw toRuntimeError("SLACK_REPLY_IN_THREAD_FAILED", error);
        }
    }
}
