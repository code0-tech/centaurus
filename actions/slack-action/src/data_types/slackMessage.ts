import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { SlackBlockSchema } from "./slackBlock.js";

/**
 * A message as returned by the Slack Web API (chat.postMessage, chat.update, …).
 * `ts` is the message timestamp and doubles as its identifier within a channel;
 * pass it back as `threadTs` to reply in a thread.
 * See https://docs.slack.dev/reference/methods/chat.postmessage
 */
export const SlackMessageSchema = z.object({
    ok: z.boolean().nullish().describe("Whether the Slack API call succeeded."),
    channel: z.string().nullish().describe("The ID of the channel the message was posted to."),
    ts: z.string().nullish().describe("The message timestamp. Identifies the message within its channel."),
    thread_ts: z.string().nullish().describe("The timestamp of the parent message when this message is a threaded reply."),
    text: z.string().nullish().describe("The fallback text of the message."),
    user: z.string().nullish().describe("The ID of the user the message was posted as."),
    bot_id: z.string().nullish().describe("The ID of the bot the message was posted as."),
    app_id: z.string().nullish().describe("The ID of the Slack app the message was posted by."),
    team: z.string().nullish().describe("The ID of the workspace the message belongs to."),
    type: z.string().nullish().describe("The message type, usually `message`."),
    subtype: z.string().nullish().describe("The message subtype, e.g. `bot_message` or `channel_join`."),
    permalink: z.string().nullish().describe("A permanent link to the message."),
    blocks: z.array(SlackBlockSchema).nullish().describe("The Block Kit blocks that make up the message body."),
});
export type SlackMessage = z.infer<typeof SlackMessageSchema>;

@Identifier("SLACK_MESSAGE")
@Name({ code: "en-US", content: "Slack message" })
@DisplayMessage({ code: "en-US", content: "Slack message" })
@Schema(SlackMessageSchema)
export class SlackMessageDataType {}
