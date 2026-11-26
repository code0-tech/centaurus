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
import { getSlackClient, resolveUserIds, toRuntimeError } from "../helpers.js";
import { BOT_TOKEN_PARAMETER, SlackBotToken } from "../data_types/slackTokens.js";
import { parseSlackChannel, SlackChannel } from "../data_types/slackChannel.js";

const CODE = "SLACK_INVITE_TO_CHANNEL_FAILED";

@Identifier("slackInviteToChannel")
@DisplayIcon("tabler:brand-slack")
@Signature("(botToken: SLACK_BOT_TOKEN, channelId: TEXT, users: LIST<TEXT>): SLACK_CHANNEL")
@Name({ code: "en-US", content: "Invite to channel" })
@DisplayMessage({ code: "en-US", content: "Invite users to Slack channel ${channelId}" })
@Documentation({
    code: "en-US",
    content:
        "Invites up to 1000 users to a channel via `conversations.invite` and returns the updated channel.\nEach user can be given by email address (needs the `users:read.email` scope), by user ID or as a mention (`<@U0123456789>`). Slack fails the whole call if any single user cannot be invited, e.g. because they are already a member.",
})
@Description({ code: "en-US", content: "Invites users to a Slack channel." })
@Parameter(BOT_TOKEN_PARAMETER)
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel to invite into." }],
})
@Parameter({
    runtimeName: "users",
    name: [{ code: "en-US", content: "Users" }],
    description: [
        {
            code: "en-US",
            content:
                "The users to invite, each as email address, user ID (e.g. U0123456789) or mention (<@U0123456789>). Up to 1000 per call.",
        },
    ],
})
export class InviteToChannelFunction {
    async run(
        _context: FunctionContext,
        botToken: SlackBotToken,
        channelId: string,
        users: string[]
    ): Promise<SlackChannel> {
        const client = getSlackClient(botToken);
        try {
            const userIds = await resolveUserIds(client, users ?? [], CODE);
            if (userIds.length === 0) {
                throw new RuntimeError(CODE, "No users given to invite.");
            }

            // conversations.invite takes the users as one comma separated value.
            const result = await client.conversations.invite({ channel: channelId, users: userIds.join(",") });
            if (!result.channel) {
                throw new RuntimeError(CODE, `Slack did not return a channel for ${channelId}.`);
            }
            return parseSlackChannel(result.channel);
        } catch (error) {
            throw toRuntimeError(CODE, error);
        }
    }
}
