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
import { getSlackClient, toRuntimeError } from "../helpers.js";
import { SlackChannel, SlackChannelSchema } from "../data_types/slackChannel.js";

@Identifier("slackInviteToChannel")
@DisplayIcon("simple:slack")
@Signature("(channelId: TEXT, userIds: LIST<TEXT>): SLACK_CHANNEL")
@Name({ code: "en-US", content: "Invite to channel" })
@DisplayMessage({ code: "en-US", content: "Invite users to Slack channel ${channelId}" })
@Documentation({
    code: "en-US",
    content:
        "Invites up to 1000 users to a channel via `conversations.invite` and returns the updated channel.\nSlack fails the whole call if any single user cannot be invited, e.g. because they are already a member.",
})
@Description({ code: "en-US", content: "Invites users to a Slack channel." })
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel to invite into." }],
})
@Parameter({
    runtimeName: "userIds",
    name: [{ code: "en-US", content: "User IDs" }],
    description: [{ code: "en-US", content: "The IDs of the users to invite. Up to 1000 per call." }],
})
export class InviteToChannelFunction {
    async run(context: FunctionContext, channelId: string, userIds: string[]): Promise<SlackChannel> {
        const client = getSlackClient(context);
        if (userIds.length === 0) {
            throw new RuntimeError("SLACK_INVITE_TO_CHANNEL_FAILED", "No user IDs provided to invite.");
        }

        try {
            // conversations.invite takes the users as one comma separated value.
            const result = await client.conversations.invite({ channel: channelId, users: userIds.join(",") });
            if (!result.channel) {
                throw new RuntimeError(
                    "SLACK_INVITE_TO_CHANNEL_FAILED",
                    `Slack did not return a channel for ${channelId}.`
                );
            }
            return SlackChannelSchema.parse(result.channel);
        } catch (error) {
            throw toRuntimeError("SLACK_INVITE_TO_CHANNEL_FAILED", error);
        }
    }
}
