import { Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { SlackBlockSchema } from "./slackBlock.js";
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
        ts: z.string().describe("The message timestamp. Pass it as the thread timestamp to reply in a thread."),
        thread_ts: z.string().nullish().describe("The timestamp of the parent message when the mention is a threaded reply."),
        event_ts: z.string().nullish().describe("The timestamp at which the event was dispatched."),
        team: z.string().nullish().describe("The ID of the workspace the message belongs to."),
        blocks: z.array(SlackBlockSchema).nullish().describe("The Block Kit blocks that make up the message body."),
    })
);

@Identifier("SlackAppMentionEventPayload")
@Name({ code: "en-US", content: "SlackAppMentionEventPayload" })
@Schema(SlackAppMentionEventPayloadSchema)
export class SlackAppMentionEventPayload {}
