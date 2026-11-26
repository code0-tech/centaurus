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
import { buildMessageContent, getSlackClient, toRuntimeError } from "../helpers.js";
import { BOT_TOKEN_PARAMETER, SlackBotToken } from "../data_types/slackTokens.js";
import { SlackEmbed } from "../data_types/slackEmbed.js";
import { parseSlackMessage, SlackMessage } from "../data_types/slackMessage.js";
import { EMBED_PARAMETER, TEXT_PARAMETER } from "./messageParameters.js";

@Identifier("slackPostMessage")
@DisplayIcon("tabler:brand-slack")
@Signature("(botToken: SLACK_BOT_TOKEN, channelId: TEXT, text?: TEXT, embed?: SLACK_EMBED): SLACK_MESSAGE")
@Name({ code: "en-US", content: "Post message" })
@DisplayMessage({ code: "en-US", content: "Post Slack message to ${channelId}" })
@Documentation({
    code: "en-US",
    content:
        "Posts a message to a Slack channel, private group or DM via `chat.postMessage`.\nThe bot must be a member of the channel. Give a text, an embed or both; the embed is a rich card with a title, text, fields, images and a footer.",
})
@Description({ code: "en-US", content: "Posts a message to a Slack channel." })
@Parameter(BOT_TOKEN_PARAMETER)
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel, private group or DM to post to (e.g. C0123456789)." }],
})
@Parameter(TEXT_PARAMETER)
@Parameter(EMBED_PARAMETER)
export class PostMessageFunction {
    async run(
        _context: FunctionContext,
        botToken: SlackBotToken,
        channelId: string,
        text?: string,
        embed?: SlackEmbed
    ): Promise<SlackMessage> {
        const client = getSlackClient(botToken);
        try {
            const result = await client.chat.postMessage({
                channel: channelId,
                ...buildMessageContent("SLACK_POST_MESSAGE_FAILED", text, embed),
            });
            return parseSlackMessage(result);
        } catch (error) {
            throw toRuntimeError("SLACK_POST_MESSAGE_FAILED", error);
        }
    }
}
