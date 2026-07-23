import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";
import {schemas} from "../generated/stripe-schemas.ts";

// Stripe delivers webhooks as an Event envelope whose `data.object` holds the
// resource that changed. For `charge.refunded` that resource is a Charge,
// generated from Stripe's official OpenAPI spec (`charge` component). Regenerate
// with `npm run generate:stripe-schemas`.
// See https://docs.stripe.com/api/events/object
export const StripeChargeRefundedWebhookPayloadSchema = z.object({
    id: z.string().describe("Unique identifier of the event (evt_...)."),
    object: z.string().describe("String representing the object's type. Always 'event'."),
    type: z.string().describe("The event type. Always 'charge.refunded' for this webhook."),
    api_version: z.string().nullish().describe("The Stripe API version used to render the event data."),
    created: z.number().describe("Time at which the event was created (Unix timestamp in seconds)."),
    livemode: z.boolean().nullish().describe("Whether the event was created in live mode or test mode."),
    data: z
        .object({
            object: schemas.charge.describe("The Charge that was refunded."),
        })
        .describe("Object containing the resource relevant to the event."),
});

@Identifier("StripeChargeRefundedWebhookPayload")
@Name({code: "en-US", content: "StripeChargeRefundedWebhookPayload"})
@Schema(StripeChargeRefundedWebhookPayloadSchema)
export class StripeChargeRefundedWebhookPayload {}
