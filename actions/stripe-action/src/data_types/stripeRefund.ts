import {DisplayMessage, Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";

// Focused view of the Stripe Refund object. Only the fields commonly used in
// automations are modelled; zod strips any additional fields the API returns.
// See https://docs.stripe.com/api/refunds/object
export const StripeRefundSchema = z.object({
    id: z.string().describe("Unique identifier of the refund (re_...)."),
    object: z.string().describe("String representing the object's type. Always 'refund'."),
    amount: z.number().describe("Amount that was refunded, in the smallest currency unit (e.g. cents)."),
    currency: z.string().describe("Three-letter ISO currency code, in lowercase."),
    status: z.string().nullish().describe("Status of the refund, e.g. 'pending', 'succeeded', 'failed', 'canceled'."),
    payment_intent: z.string().nullish().describe("ID of the PaymentIntent that was refunded (pi_...), if any."),
    charge: z.string().nullish().describe("ID of the charge that was refunded (ch_...), if any."),
    reason: z.string().nullish().describe("Reason for the refund, e.g. 'duplicate', 'fraudulent', 'requested_by_customer'."),
    created: z.number().describe("Time at which the refund was created (Unix timestamp in seconds)."),
    metadata: z.record(z.string(), z.string()).nullish().describe("Set of key-value pairs attached to the refund."),
});
export type StripeRefund = z.infer<typeof StripeRefundSchema>;

@Identifier("STRIPE_REFUND")
@Name({code: "en-US", content: "Stripe refund"})
@DisplayMessage({code: "en-US", content: "Stripe refund ${id}"})
@Schema(StripeRefundSchema)
export class StripeRefundDataType {}
