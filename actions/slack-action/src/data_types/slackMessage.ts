import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { withoutUndefined } from "../helpers.js";

/**
 * A message as returned by the Slack Web API (chat.postMessage, chat.update, …).
 * `ts` (`1712345678.123456`) identifies the message within its channel; pass it
 * on as message ID to reply in a thread, update, delete or react to the message.
 * See https://docs.slack.dev/reference/methods/chat.postmessage
 */
export const SlackMessageSchema = z.object({
    ok: z.boolean().nullish().describe("Whether the Slack API call succeeded."),
    channel: z.string().nullish().describe("The ID of the channel the message was posted to."),
    ts: z.string().nullish().describe("The ID of the message within its channel, i.e. its Slack `ts` (e.g. 1712345678.123456)."),
    thread_ts: z.string().nullish().describe("The ID (`ts`) of the parent message when this message is a threaded reply."),
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
 * Parses a chat.* response of the Slack Web API.
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
            ts: result.ts ?? message.ts,
        })
    );
}

@Identifier("SLACK_MESSAGE")
@Name({ code: "en-US", content: "Slack message" })
@DisplayMessage({ code: "en-US", content: "Slack message" })
@Schema(SlackMessageSchema)
export class SlackMessageDataType {}
