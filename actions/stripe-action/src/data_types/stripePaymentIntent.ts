import {DisplayMessage, Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";

// Focused view of the Stripe PaymentIntent object. Only the fields commonly used
// in automations are modelled; zod strips any additional fields the API returns.
// See https://docs.stripe.com/api/payment_intents/object
export const StripePaymentIntentSchema = z.object({
    id: z.string().describe("Unique identifier of the PaymentIntent (pi_...)."),
    object: z.string().describe("String representing the object's type. Always 'payment_intent'."),
    amount: z.number().describe("Amount intended to be collected, in the smallest currency unit (e.g. cents)."),
    amount_received: z.number().nullish().describe("Amount that was collected by this PaymentIntent, in the smallest currency unit."),
    currency: z.string().describe("Three-letter ISO currency code, in lowercase."),
    status: z.string().describe("Status of the PaymentIntent, e.g. 'requires_payment_method', 'processing', 'succeeded', 'canceled'."),
    customer: z.string().nullish().describe("ID of the customer this PaymentIntent belongs to (cus_...), if any."),
    description: z.string().nullish().describe("An arbitrary string attached to the PaymentIntent."),
    client_secret: z.string().nullish().describe("Client secret used on the client side to complete the payment. Handle securely."),
    receipt_email: z.string().nullish().describe("Email address that the receipt for this payment will be sent to."),
    created: z.number().describe("Time at which the PaymentIntent was created (Unix timestamp in seconds)."),
    livemode: z.boolean().nullish().describe("Whether the object exists in live mode or test mode."),
    metadata: z.record(z.string(), z.string()).nullish().describe("Set of key-value pairs attached to the PaymentIntent."),
});
export type StripePaymentIntent = z.infer<typeof StripePaymentIntentSchema>;

@Identifier("STRIPE_PAYMENT_INTENT")
@Name({code: "en-US", content: "Stripe payment intent"})
@DisplayMessage({code: "en-US", content: "Stripe payment intent ${id}"})
@Schema(StripePaymentIntentSchema)
export class StripePaymentIntentDataType {}
