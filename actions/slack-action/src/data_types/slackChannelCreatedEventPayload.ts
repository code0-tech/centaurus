import { Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { slackEventEnvelope } from "./slackEventEnvelope.js";

/**
 * Payload of a `channel_created` event: a new public channel was created in the
 * workspace. Only a slim channel stub is delivered — call the Slack API if the
 * flow needs the full conversation object.
 * See https://docs.slack.dev/reference/events/channel_created
 */
export const SlackChannelCreatedEventPayloadSchema = slackEventEnvelope(
    z.object({
        type: z.string().describe("The event type. Always `channel_created` for this event."),
        channel: z
            .object({
                id: z.string().describe("The ID of the newly created channel."),
                name: z.string().nullish().describe("The channel name without the leading #."),
                created: z.number().nullish().describe("The Unix timestamp at which the channel was created."),
                creator: z.string().nullish().describe("The ID of the user who created the channel."),
                is_channel: z.boolean().nullish().describe("Whether the conversation is a channel."),
            })
            .describe("The channel that was created."),
        event_ts: z.string().nullish().describe("The timestamp at which the event was dispatched."),
    })
);

@Identifier("SlackChannelCreatedEventPayload")
@Name({ code: "en-US", content: "SlackChannelCreatedEventPayload" })
@Schema(SlackChannelCreatedEventPayloadSchema)
export class SlackChannelCreatedEventPayload {}
