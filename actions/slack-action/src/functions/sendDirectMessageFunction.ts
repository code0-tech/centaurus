import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { buildMessageContent, getSlackClient, resolveUserIds, toRuntimeError } from "../helpers.js";
import { BOT_TOKEN_PARAMETER, SlackBotToken } from "../data_types/slackTokens.js";
import { SlackEmbed } from "../data_types/slackEmbed.js";
import { parseSlackMessage, SlackMessage } from "../data_types/slackMessage.js";
import { EMBED_PARAMETER, TEXT_PARAMETER } from "./messageParameters.js";

const CODE = "SLACK_SEND_DIRECT_MESSAGE_FAILED";

@Identifier("slackSendDirectMessage")
@DisplayIcon("tabler:brand-slack")
@Signature("(botToken: SLACK_BOT_TOKEN, user: TEXT, text?: TEXT, embed?: SLACK_EMBED): SLACK_MESSAGE")
@Name({ code: "en-US", content: "Send direct message" })
@DisplayMessage({ code: "en-US", content: "Send Slack DM to ${user}" })
@Documentation({
    code: "en-US",
    content:
        "Sends a direct message to a single user. Opens (or reuses) the IM channel between the bot and the user via `conversations.open`, then posts into it.\nThe user can be given by email address (needs the `users:read.email` scope), by user ID or as a mention (`<@U0123456789>`).",
})
@Description({ code: "en-US", content: "Sends a direct message to a Slack user." })
@Parameter(BOT_TOKEN_PARAMETER)
@Parameter({
    runtimeName: "user",
    name: [{ code: "en-US", content: "User" }],
    description: [
        {
            code: "en-US",
            content: "The user to message: their email address, user ID (e.g. U0123456789) or mention (<@U0123456789>).",
        },
    ],
})
@Parameter(TEXT_PARAMETER)
@Parameter(EMBED_PARAMETER)
export class SendDirectMessageFunction {
    async run(
        _context: FunctionContext,
        botToken: SlackBotToken,
        user: string,
        text?: string,
        embed?: SlackEmbed
    ): Promise<SlackMessage> {
        const client = getSlackClient(botToken);
        try {
            const content = buildMessageContent(CODE, text, embed);
            const [userId] = await resolveUserIds(client, [user], CODE);
            if (!userId) {
                throw new RuntimeError(CODE, "No user given to message.");
            }

            const conversation = await client.conversations.open({ users: userId });
            const channelId = conversation.channel?.id;
            if (!channelId) {
                throw new RuntimeError(CODE, `Slack did not return an IM channel for user ${user}.`);
            }

            const result = await client.chat.postMessage({ channel: channelId, ...content });
            return parseSlackMessage(result);
        } catch (error) {
            throw toRuntimeError(CODE, error);
        }
    }
}
