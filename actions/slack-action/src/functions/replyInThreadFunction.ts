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
import { buildMessageContent, getSlackClient, toRuntimeError, toMessageTs } from "../helpers.js";
import { BOT_TOKEN_PARAMETER, SlackBotToken } from "../data_types/slackTokens.js";
import { SlackEmbed } from "../data_types/slackEmbed.js";
import { parseSlackMessage, SlackMessage } from "../data_types/slackMessage.js";
import { EMBED_PARAMETER, MESSAGE_ID_DESCRIPTION, TEXT_PARAMETER } from "./messageParameters.js";

const CODE = "SLACK_REPLY_IN_THREAD_FAILED";

@Identifier("slackReplyInThread")
@DisplayIcon("tabler:brand-slack")
@Signature(
    "(botToken: SLACK_BOT_TOKEN, channelId: TEXT, parentMessageId: TEXT, text?: TEXT, embed?: SLACK_EMBED): SLACK_MESSAGE"
)
@Name({ code: "en-US", content: "Reply in thread" })
@DisplayMessage({ code: "en-US", content: "Reply in Slack thread in ${channelId}" })
@Documentation({
    code: "en-US",
    content:
        "Posts a message as a threaded reply to an existing message.\nThe parent message ID is its `ts` (e.g. `1712345678.123456`) — take it from a SlackMessagePosted or SlackAppMentioned trigger, or from the result of `slackPostMessage`. A message link copied from Slack works as well.",
})
@Description({ code: "en-US", content: "Replies to a Slack message in its thread." })
@Parameter(BOT_TOKEN_PARAMETER)
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel holding the parent message." }],
})
@Parameter({
    runtimeName: "parentMessageId",
    name: [{ code: "en-US", content: "Parent message ID" }],
    description: [{ code: "en-US", content: `The ID of the message to reply to. ${MESSAGE_ID_DESCRIPTION}` }],
})
@Parameter(TEXT_PARAMETER)
@Parameter(EMBED_PARAMETER)
export class ReplyInThreadFunction {
    async run(
        _context: FunctionContext,
        botToken: SlackBotToken,
        channelId: string,
        parentMessageId: string,
        text?: string,
        embed?: SlackEmbed
    ): Promise<SlackMessage> {
        const client = getSlackClient(botToken);
        try {
            const result = await client.chat.postMessage({
                channel: channelId,
                thread_ts: toMessageTs(parentMessageId, CODE),
                ...buildMessageContent(CODE, text, embed),
            });
            return parseSlackMessage(result);
        } catch (error) {
            throw toRuntimeError(CODE, error);
        }
    }
}
