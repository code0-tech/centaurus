import { dateSchema, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { slackEventEnvelope } from "./slackEventEnvelope.js";

/**
 * Payload of a `message.channels` event: a message was posted in a public
 * channel the app is a member of.
 * See https://docs.slack.dev/reference/events/message
 */
export const SlackMessagePostedEventPayloadSchema = slackEventEnvelope(
    z.object({
        type: z.string().describe("The event type. Always `message` for this event."),
        subtype: z.string().nullish().describe("The message subtype, e.g. `bot_message` or `message_changed`. Absent for plain user messages."),
        channel: z.string().describe("The ID of the channel the message was posted in."),
        channel_type: z.string().nullish().describe("The kind of channel, e.g. `channel`, `group`, `im` or `mpim`."),
        user: z.string().nullish().describe("The ID of the user who posted the message."),
        bot_id: z.string().nullish().describe("The ID of the bot that posted the message, if any."),
        text: z.string().nullish().describe("The message text."),
        ts: dateSchema.describe("When the message was posted. Identifies the message: pass it on to reply in its thread, react to it, update or delete it."),
        thread_ts: dateSchema.nullish().describe("The ts of the parent message when this message is a threaded reply."),
        event_ts: dateSchema.nullish().describe("When the event was dispatched."),
        team: z.string().nullish().describe("The ID of the workspace the message belongs to."),
    })
);

@Identifier("SlackMessagePostedEventPayload")
@Name({ code: "en-US", content: "SlackMessagePostedEventPayload" })
@Schema(SlackMessagePostedEventPayloadSchema)
export class SlackMessagePostedEventPayload {}
