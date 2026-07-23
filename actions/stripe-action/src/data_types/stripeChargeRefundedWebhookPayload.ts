import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";

// Stripe delivers webhooks as an Event envelope whose `data.object` holds the
// resource that changed. For `charge.refunded` that resource is a Charge. Only
// the commonly used Charge fields are modelled here; zod strips the rest.
// See https://docs.stripe.com/api/events/object and
// https://docs.stripe.com/api/charges/object
const StripeChargeSchema = z.object({
    id: z.string().describe("Unique identifier of the charge (ch_...)."),
    object: z.string().describe("String representing the object's type. Always 'charge'."),
    amount: z.number().describe("Amount intended to be collected, in the smallest currency unit (e.g. cents)."),
    amount_refunded: z.number().describe("Amount that has been refunded, in the smallest currency unit."),
    currency: z.string().describe("Three-letter ISO currency code, in lowercase."),
    refunded: z.boolean().describe("Whether the charge has been fully refunded."),
    paid: z.boolean().nullish().describe("Whether the charge succeeded and the funds were captured."),
    status: z.string().nullish().describe("Status of the charge, e.g. 'succeeded', 'pending', 'failed'."),
    payment_intent: z.string().nullish().describe("ID of the PaymentIntent associated with this charge (pi_...), if any."),
    customer: z.string().nullish().describe("ID of the customer this charge belongs to (cus_...), if any."),
    receipt_email: z.string().nullish().describe("Email address to which the receipt for this charge was sent."),
    created: z.number().describe("Time at which the charge was created (Unix timestamp in seconds)."),
    metadata: z.record(z.string(), z.string()).nullish().describe("Set of key-value pairs attached to the charge."),
});

export const StripeChargeRefundedWebhookPayloadSchema = z.object({
    id: z.string().describe("Unique identifier of the event (evt_...)."),
    object: z.string().describe("String representing the object's type. Always 'event'."),
    type: z.string().describe("The event type. Always 'charge.refunded' for this webhook."),
    api_version: z.string().nullish().describe("The Stripe API version used to render the event data."),
    created: z.number().describe("Time at which the event was created (Unix timestamp in seconds)."),
    livemode: z.boolean().nullish().describe("Whether the event was created in live mode or test mode."),
    data: z
        .object({
            object: StripeChargeSchema.describe("The Charge that was refunded."),
        })
        .describe("Object containing the resource relevant to the event."),
});

@Identifier("StripeChargeRefundedWebhookPayload")
@Name({code: "en-US", content: "StripeChargeRefundedWebhookPayload"})
@Schema(StripeChargeRefundedWebhookPayloadSchema)
export class StripeChargeRefundedWebhookPayload {}
