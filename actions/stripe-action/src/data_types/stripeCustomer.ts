import {DisplayMessage, Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";

// Focused view of the Stripe Customer object. Only the fields commonly used in
// automations are modelled; zod strips any additional fields the API returns.
// See https://docs.stripe.com/api/customers/object
export const StripeCustomerSchema = z.object({
    id: z.string().describe("Unique identifier of the customer (cus_...)."),
    object: z.string().describe("String representing the object's type. Always 'customer'."),
    email: z.string().nullish().describe("The customer's email address."),
    name: z.string().nullish().describe("The customer's full name or business name."),
    description: z.string().nullish().describe("An arbitrary string attached to the customer."),
    phone: z.string().nullish().describe("The customer's phone number."),
    currency: z.string().nullish().describe("Three-letter ISO currency code for the customer's default currency."),
    created: z.number().describe("Time at which the customer was created (Unix timestamp in seconds)."),
    livemode: z.boolean().nullish().describe("Whether the object exists in live mode or test mode."),
    metadata: z.record(z.string(), z.string()).nullish().describe("Set of key-value pairs attached to the customer."),
});
export type StripeCustomer = z.infer<typeof StripeCustomerSchema>;

@Identifier("STRIPE_CUSTOMER")
@Name({code: "en-US", content: "Stripe customer"})
@DisplayMessage({code: "en-US", content: "Stripe customer ${id}"})
@Schema(StripeCustomerSchema)
export class StripeCustomerDataType {}
