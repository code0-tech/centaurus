import {DisplayMessage, Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";
import {schemas} from "../generated/stripe-schemas.ts";

/**
 * STRIPE_PAYMENT_INTENT is generated from Stripe's official OpenAPI spec
 * (stripe/openapi, openapi/spec3.sdk.json). The spec is reduced to the
 * `payment_intent` resource plus every schema it transitively references
 * (shared scripts/openapi-filter.mjs) and converted to zod by the shared
 * scripts/openapi-to-zod.mjs, so nested objects are fully typed.
 * Regenerate with `npm run generate:stripe-schemas`.
 */
export const StripePaymentIntentSchema = schemas.payment_intent;
export type StripePaymentIntent = z.infer<typeof StripePaymentIntentSchema>;

@Identifier("STRIPE_PAYMENT_INTENT")
@Name({code: "en-US", content: "Stripe payment intent"})
@DisplayMessage({code: "en-US", content: "Stripe payment intent ${id}"})
@Schema(StripePaymentIntentSchema)
export class StripePaymentIntentDataType {}
