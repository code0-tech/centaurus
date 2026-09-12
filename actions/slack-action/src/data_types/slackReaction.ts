import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * An emoji reaction on a message, identified by the message it points at
 * (`item`) and the emoji name without the surrounding colons.
 * See https://docs.slack.dev/reference/methods/reactions.add
 */
export const SlackReactionSchema = z.object({
    name: z.string().describe("The emoji name without the surrounding colons, e.g. thumbsup."),
    user: z.string().nullish().describe("The ID of the user who added the reaction."),
    item_user: z.string().nullish().describe("The ID of the user whose item was reacted to."),
    count: z.number().nullish().describe("How many users reacted with this emoji."),
    users: z.array(z.string()).nullish().describe("The IDs of the users who reacted with this emoji."),
    item: z
        .object({
            type: z.string().nullish().describe("The type of the item reacted to, usually message."),
            channel: z.string().nullish().describe("The ID of the channel holding the item."),
            ts: z.string().nullish().describe("The timestamp of the message reacted to."),
            file: z.string().nullish().describe("The ID of the file reacted to."),
        })
        .nullish()
        .describe("The item the reaction was added to."),
    event_ts: z.string().nullish().describe("The timestamp at which the reaction event occurred."),
});
export type SlackReaction = z.infer<typeof SlackReactionSchema>;

@Identifier("SLACK_REACTION")
@Name({ code: "en-US", content: "Slack reaction" })
@DisplayMessage({ code: "en-US", content: "Slack reaction" })
@Schema(SlackReactionSchema)
export class SlackReactionDataType {}
