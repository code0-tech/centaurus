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

@Identifier("slackCreateChannel")
@DisplayIcon("simple:slack")
@Signature("(name: TEXT, isPrivate?: BOOLEAN): SLACK_CHANNEL")
@Name({ code: "en-US", content: "Create channel" })
@DisplayMessage({ code: "en-US", content: "Create Slack channel #${name}" })
@Documentation({
    code: "en-US",
    content:
        "Creates a channel via `conversations.create`.\nSlack channel names are lowercase, max 80 characters, and may only contain letters, digits, hyphens and underscores. The creating app becomes a member, so it can post right away.",
})
@Description({ code: "en-US", content: "Creates a Slack channel." })
@Parameter({
    runtimeName: "name",
    name: [{ code: "en-US", content: "Name" }],
    description: [
        {
            code: "en-US",
            content: "The channel name without the leading #. Lowercase, max 80 characters, letters, digits, hyphens and underscores only.",
        },
    ],
})
@Parameter({
    runtimeName: "isPrivate",
    name: [{ code: "en-US", content: "Private" }],
    description: [{ code: "en-US", content: "Whether to create a private channel. Defaults to a public channel." }],
    optional: true,
})
export class CreateChannelFunction {
    async run(context: FunctionContext, name: string, isPrivate?: boolean): Promise<SlackChannel> {
        const client = getSlackClient(context);
        try {
            const result = await client.conversations.create({ name, is_private: isPrivate ?? false });
            if (!result.channel) {
                throw new RuntimeError("SLACK_CREATE_CHANNEL_FAILED", `Slack did not return a channel for ${name}.`);
            }
            return SlackChannelSchema.parse(result.channel);
        } catch (error) {
            throw toRuntimeError("SLACK_CREATE_CHANNEL_FAILED", error);
        }
    }
}
