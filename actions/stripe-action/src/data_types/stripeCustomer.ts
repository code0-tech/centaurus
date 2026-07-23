import {DisplayMessage, Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";
import {schemas} from "../generated/stripe-schemas.ts";

/**
 * STRIPE_CUSTOMER is generated from Stripe's official OpenAPI spec
 * (stripe/openapi, openapi/spec3.sdk.json). The spec is filtered down to the
 * `customer` component (see scripts/filterStripeSpec.mjs) and converted to a
 * zod schema by openapi-zod-client. Regenerate with
 * `npm run generate:stripe-schemas`.
 */
export const StripeCustomerSchema = schemas.customer;
export type StripeCustomer = z.infer<typeof StripeCustomerSchema>;

@Identifier("STRIPE_CUSTOMER")
@Name({code: "en-US", content: "Stripe customer"})
@DisplayMessage({code: "en-US", content: "Stripe customer ${id}"})
@Schema(StripeCustomerSchema)
export class StripeCustomerDataType {}
