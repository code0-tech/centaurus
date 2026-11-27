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
import { getSlackClient, resolveUserId, toRuntimeError } from "../helpers.js";
import { BOT_TOKEN_PARAMETER, SlackBotToken } from "../data_types/slackTokens.js";
import { parseSlackChannel, SlackChannel } from "../data_types/slackChannel.js";

const CODE = "SLACK_INVITE_TO_CHANNEL_FAILED";

@Identifier("slackInviteToChannel")
@DisplayIcon("tabler:brand-slack")
@Signature("(botToken: SLACK_BOT_TOKEN, channelId: TEXT, user: TEXT): SLACK_CHANNEL")
@Name({ code: "en-US", content: "Invite to channel" })
@DisplayMessage({ code: "en-US", content: "Invite ${user} to Slack channel ${channelId}" })
@Documentation({
    code: "en-US",
    content:
        "Invites a single user to a channel via `conversations.invite` and returns the updated channel.\nThe user can be given by email address (needs the `users:read.email` scope), by user ID or as a mention (`<@U0123456789>`). Slack fails the call if the user cannot be invited, e.g. because they are already a member.",
})
@Description({ code: "en-US", content: "Invites a user to a Slack channel." })
@Parameter(BOT_TOKEN_PARAMETER)
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel to invite into." }],
})
@Parameter({
    runtimeName: "user",
    name: [{ code: "en-US", content: "User" }],
    description: [
        {
            code: "en-US",
            content: "The user to invite: their email address, user ID (e.g. U0123456789) or mention (<@U0123456789>).",
        },
    ],
})
export class InviteToChannelFunction {
    async run(
        _context: FunctionContext,
        botToken: SlackBotToken,
        channelId: string,
        user: string
    ): Promise<SlackChannel> {
        const client = getSlackClient(botToken);
        try {
            const userId = await resolveUserId(client, user, CODE);
            if (!userId) {
                throw new RuntimeError(CODE, "No user given to invite.");
            }

            const result = await client.conversations.invite({ channel: channelId, users: userId });
            if (!result.channel) {
                throw new RuntimeError(CODE, `Slack did not return a channel for ${channelId}.`);
            }
            return parseSlackChannel(result.channel);
        } catch (error) {
            throw toRuntimeError(CODE, error);
        }
    }
}
