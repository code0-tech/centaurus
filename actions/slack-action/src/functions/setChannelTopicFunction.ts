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

@Identifier("slackSetChannelTopic")
@DisplayIcon("simple:slack")
@Signature("(channelId: TEXT, topic: TEXT): SLACK_CHANNEL")
@Name({ code: "en-US", content: "Set channel topic" })
@DisplayMessage({ code: "en-US", content: "Set topic of Slack channel ${channelId}" })
@Documentation({
    code: "en-US",
    content:
        "Sets a channel's topic via `conversations.setTopic` and returns the updated channel.\nThe topic is capped at 250 characters and setting it posts a visible notice into the channel.",
})
@Description({ code: "en-US", content: "Sets the topic of a Slack channel." })
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel whose topic to set." }],
})
@Parameter({
    runtimeName: "topic",
    name: [{ code: "en-US", content: "Topic" }],
    description: [{ code: "en-US", content: "The new channel topic. Max 250 characters." }],
})
export class SetChannelTopicFunction {
    async run(context: FunctionContext, channelId: string, topic: string): Promise<SlackChannel> {
        const client = getSlackClient(context);
        try {
            const result = await client.conversations.setTopic({ channel: channelId, topic });
            if (!result.channel) {
                throw new RuntimeError(
                    "SLACK_SET_CHANNEL_TOPIC_FAILED",
                    `Slack did not return a channel for ${channelId}.`
                );
            }
            return SlackChannelSchema.parse(result.channel);
        } catch (error) {
            throw toRuntimeError("SLACK_SET_CHANNEL_TOPIC_FAILED", error);
        }
    }
}
