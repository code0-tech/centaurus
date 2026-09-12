import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * A Slack conversation: a public or private channel, a DM (`is_im`) or a group
 * DM (`is_mpim`).
 * See https://docs.slack.dev/reference/objects/conversation-object
 */
export const SlackChannelSchema = z.object({
    id: z.string().describe("The channel ID, e.g. C0123456789."),
    name: z.string().nullish().describe("The channel name without the leading #."),
    is_channel: z.boolean().nullish().describe("Whether the conversation is a channel."),
    is_group: z.boolean().nullish().describe("Whether the conversation is a legacy private group."),
    is_im: z.boolean().nullish().describe("Whether the conversation is a direct message."),
    is_mpim: z.boolean().nullish().describe("Whether the conversation is a group direct message."),
    is_private: z.boolean().nullish().describe("Whether the channel is private."),
    is_archived: z.boolean().nullish().describe("Whether the channel has been archived."),
    created: z.number().nullish().describe("The Unix timestamp at which the channel was created."),
    creator: z.string().nullish().describe("The ID of the user who created the channel."),
    num_members: z.number().nullish().describe("The number of members in the channel."),
    topic: z
        .object({
            value: z.string().nullish().describe("The channel topic."),
            creator: z.string().nullish().describe("The ID of the user who set the topic."),
            last_set: z.number().nullish().describe("The Unix timestamp at which the topic was last set."),
        })
        .nullish()
        .describe("The channel topic."),
    purpose: z
        .object({
            value: z.string().nullish().describe("The channel purpose."),
            creator: z.string().nullish().describe("The ID of the user who set the purpose."),
            last_set: z.number().nullish().describe("The Unix timestamp at which the purpose was last set."),
        })
        .nullish()
        .describe("The channel purpose."),
});
export type SlackChannel = z.infer<typeof SlackChannelSchema>;

@Identifier("SLACK_CHANNEL")
@Name({ code: "en-US", content: "Slack channel" })
@DisplayMessage({ code: "en-US", content: "Slack channel" })
@Schema(SlackChannelSchema)
export class SlackChannelDataType {}
