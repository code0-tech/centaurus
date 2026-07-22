import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";
import {StripePaymentIntentSchema} from "./stripePaymentIntent.ts";

// Stripe delivers webhooks as an Event envelope whose `data.object` holds the
// resource that changed. For `payment_intent.succeeded` that resource is a
// PaymentIntent. See https://docs.stripe.com/api/events/object
export const StripePaymentIntentSucceededWebhookPayloadSchema = z.object({
    id: z.string().describe("Unique identifier of the event (evt_...)."),
    object: z.string().describe("String representing the object's type. Always 'event'."),
    type: z.string().describe("The event type. Always 'payment_intent.succeeded' for this webhook."),
    api_version: z.string().nullish().describe("The Stripe API version used to render the event data."),
    created: z.number().describe("Time at which the event was created (Unix timestamp in seconds)."),
    livemode: z.boolean().nullish().describe("Whether the event was created in live mode or test mode."),
    data: z
        .object({
            object: StripePaymentIntentSchema.describe("The PaymentIntent that succeeded."),
        })
        .describe("Object containing the resource relevant to the event."),
});
export type StripePaymentIntentSucceededWebhookPayload = z.infer<
    typeof StripePaymentIntentSucceededWebhookPayloadSchema
>;

@Identifier("StripePaymentIntentSucceededWebhookPayload")
@Name({code: "en-US", content: "StripePaymentIntentSucceededWebhookPayload"})
@Schema(StripePaymentIntentSucceededWebhookPayloadSchema)
export class StripePaymentIntentSucceededWebhookPayload {}
