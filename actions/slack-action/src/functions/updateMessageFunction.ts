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
import { buildMessageContent, getSlackClient, toRuntimeError, toSlackTs } from "../helpers.js";
import { BOT_TOKEN_PARAMETER, SlackBotToken } from "../data_types/slackTokens.js";
import { SlackEmbed } from "../data_types/slackEmbed.js";
import { parseSlackMessage, SlackMessage } from "../data_types/slackMessage.js";
import { EMBED_PARAMETER, MESSAGE_TS_DESCRIPTION, TEXT_PARAMETER } from "./messageParameters.js";

const CODE = "SLACK_UPDATE_MESSAGE_FAILED";

@Identifier("slackUpdateMessage")
@DisplayIcon("tabler:brand-slack")
@Signature("(botToken: SLACK_BOT_TOKEN, channelId: TEXT, ts: DATE, text?: TEXT, embed?: SLACK_EMBED): SLACK_MESSAGE")
@Name({ code: "en-US", content: "Update message" })
@DisplayMessage({ code: "en-US", content: "Update Slack message in ${channelId}" })
@Documentation({
    code: "en-US",
    content:
        "Replaces the text and embed of a message via `chat.update`.\nA bot token can only update messages the app itself posted. Use it to turn an approval request into its outcome, e.g. after a SlackReactionAdded trigger.",
})
@Description({ code: "en-US", content: "Updates a Slack message the app posted." })
@Parameter(BOT_TOKEN_PARAMETER)
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel holding the message." }],
})
@Parameter({
    runtimeName: "ts",
    name: [{ code: "en-US", content: "Message" }],
    description: [{ code: "en-US", content: `The ts of the message to update. ${MESSAGE_TS_DESCRIPTION}` }],
})
@Parameter(TEXT_PARAMETER)
@Parameter(EMBED_PARAMETER)
export class UpdateMessageFunction {
    async run(
        _context: FunctionContext,
        botToken: SlackBotToken,
        channelId: string,
        ts: number,
        text?: string,
        embed?: SlackEmbed
    ): Promise<SlackMessage> {
        const client = getSlackClient(botToken);
        try {
            const result = await client.chat.update({
                channel: channelId,
                ts: toSlackTs(ts, CODE),
                ...buildMessageContent(CODE, text, embed),
            });
            return parseSlackMessage(result);
        } catch (error) {
            throw toRuntimeError(CODE, error);
        }
    }
}
