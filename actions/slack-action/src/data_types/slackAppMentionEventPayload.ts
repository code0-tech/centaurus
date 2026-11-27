import { dateSchema, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { slackEventEnvelope } from "./slackEventEnvelope.js";

/**
 * Payload of an `app_mention` event: the bot user was @-mentioned in a message.
 * See https://docs.slack.dev/reference/events/app_mention
 */
export const SlackAppMentionEventPayloadSchema = slackEventEnvelope(
    z.object({
        type: z.string().describe("The event type. Always `app_mention` for this event."),
        channel: z.string().describe("The ID of the channel the bot was mentioned in."),
        user: z.string().nullish().describe("The ID of the user who mentioned the bot."),
        bot_id: z.string().nullish().describe("The ID of the bot that posted the message, if any."),
        text: z.string().nullish().describe("The full message text, including the `<@BOTID>` mention."),
        ts: z.string().describe("The ID of the message, i.e. its Slack `ts` (e.g. 1712345678.123456). Pass it on as Message ID to reply in its thread, react to it, update or delete it."),
        thread_ts: z.string().nullish().describe("The ID (`ts`) of the parent message when the mention is a threaded reply."),
        event_ts: dateSchema.nullish().describe("When the event was dispatched."),
        team: z.string().nullish().describe("The ID of the workspace the message belongs to."),
    })
);

@Identifier("SlackAppMentionEventPayload")
@Name({ code: "en-US", content: "SlackAppMentionEventPayload" })
@Schema(SlackAppMentionEventPayloadSchema)
export class SlackAppMentionEventPayload {}
