import { z } from "zod";

/**
 * Every Events API delivery arrives wrapped in the same `event_callback`
 * envelope; only the inner `event` object differs per event type. This builder
 * keeps the envelope in one place so each payload file only has to describe its
 * own event.
 * See https://docs.slack.dev/apis/events-api#event-type-structure
 */
export const slackEventEnvelope = <T extends z.ZodType>(event: T) =>
    z.object({
        token: z.string().nullish().describe("The deprecated verification token. Validate the request signature instead."),
        team_id: z.string().nullish().describe("The ID of the workspace the event happened in."),
        api_app_id: z.string().nullish().describe("The ID of the Slack app the event was delivered to."),
        type: z.string().describe("The envelope type. Always `event_callback` for Events API deliveries."),
        event_id: z.string().nullish().describe("A unique identifier for this delivery, usable for deduplication."),
        event_time: z.number().nullish().describe("The Unix timestamp at which the event happened."),
        event_context: z.string().nullish().describe("An opaque string identifying the event's subscription context."),
        event,
    });
