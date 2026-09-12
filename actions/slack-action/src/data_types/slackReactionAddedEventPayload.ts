import { Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { slackEventEnvelope } from "./slackEventEnvelope.js";

/**
 * Payload of a `reaction_added` event: a member added an emoji reaction to a
 * message or file. This is the event behind approval and reaction-role flows —
 * match on `event.reaction` to decide what a reaction means.
 * See https://docs.slack.dev/reference/events/reaction_added
 */
export const SlackReactionAddedEventPayloadSchema = slackEventEnvelope(
    z.object({
        type: z.string().describe("The event type. Always `reaction_added` for this event."),
        user: z.string().describe("The ID of the user who added the reaction."),
        reaction: z.string().describe("The emoji name without the surrounding colons, e.g. white_check_mark."),
        item_user: z.string().nullish().describe("The ID of the user who created the item that was reacted to."),
        item: z
            .object({
                type: z.string().describe("The type of the item reacted to, e.g. `message` or `file`."),
                channel: z.string().nullish().describe("The ID of the channel holding the item."),
                ts: z.string().nullish().describe("The timestamp of the message reacted to."),
                file: z.string().nullish().describe("The ID of the file reacted to."),
            })
            .describe("The item the reaction was added to."),
        event_ts: z.string().nullish().describe("The timestamp at which the event was dispatched."),
    })
);

@Identifier("SlackReactionAddedEventPayload")
@Name({ code: "en-US", content: "SlackReactionAddedEventPayload" })
@Schema(SlackReactionAddedEventPayloadSchema)
export class SlackReactionAddedEventPayload {}
