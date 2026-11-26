import { dateSchema, DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { fromSlackTs, withoutUndefined } from "../helpers.js";

/**
 * A message as returned by the Slack Web API (chat.postMessage, chat.update, …).
 * `ts` is the point in time the message was posted and doubles as its
 * identifier within a channel; pass it on to reply in a thread, update, delete
 * or react to the message.
 * See https://docs.slack.dev/reference/methods/chat.postmessage
 */
export const SlackMessageSchema = z.object({
    ok: z.boolean().nullish().describe("Whether the Slack API call succeeded."),
    channel: z.string().nullish().describe("The ID of the channel the message was posted to."),
    ts: dateSchema.nullish().describe("When the message was posted. Identifies the message within its channel."),
    thread_ts: dateSchema.nullish().describe("The ts of the parent message when this message is a threaded reply."),
    text: z.string().nullish().describe("The fallback text of the message."),
    user: z.string().nullish().describe("The ID of the user the message was posted as."),
    bot_id: z.string().nullish().describe("The ID of the bot the message was posted as."),
    app_id: z.string().nullish().describe("The ID of the Slack app the message was posted by."),
    team: z.string().nullish().describe("The ID of the workspace the message belongs to."),
    type: z.string().nullish().describe("The message type, usually `message`."),
    subtype: z.string().nullish().describe("The message subtype, e.g. `bot_message` or `channel_join`."),
    permalink: z.string().nullish().describe("A permanent link to the message."),
});
export type SlackMessage = z.infer<typeof SlackMessageSchema>;

type RawSlackMessage = { ts?: string; thread_ts?: string; channel?: string };

/**
 * Parses a chat.* response of the Slack Web API, converting the message
 * timestamps into `DATE` values.
 */
export function parseSlackMessage(result: {
    ok?: boolean;
    channel?: string;
    ts?: string;
    message?: object;
}): SlackMessage {
    const message = (result.message ?? {}) as RawSlackMessage;
    return withoutUndefined(
        SlackMessageSchema.strip().parse({
            ...message,
            ok: result.ok,
            channel: result.channel ?? message.channel,
            ts: fromSlackTs(result.ts ?? message.ts),
            thread_ts: fromSlackTs(message.thread_ts),
        })
    );
}

@Identifier("SLACK_MESSAGE")
@Name({ code: "en-US", content: "Slack message" })
@DisplayMessage({ code: "en-US", content: "Slack message" })
@Schema(SlackMessageSchema)
export class SlackMessageDataType {}
