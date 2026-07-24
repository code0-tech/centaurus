import {DisplayMessage, Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";
import {schemas} from "../generated/stripe-schemas.ts";

/**
 * STRIPE_REFUND is generated from Stripe's official OpenAPI spec
 * (stripe/openapi, openapi/spec3.sdk.json). The spec is reduced to the
 * `refund` resource plus every schema it transitively references (shared
 * scripts/openapi-filter.mjs) and converted to zod by the shared
 * scripts/openapi-to-zod.mjs, so nested objects are fully typed.
 * Regenerate with `npm run generate:stripe-schemas`.
 */
export const StripeRefundSchema = schemas.refund;
export type StripeRefund = z.infer<typeof StripeRefundSchema>;

@Identifier("STRIPE_REFUND")
@Name({code: "en-US", content: "Stripe refund"})
@DisplayMessage({code: "en-US", content: "Stripe refund ${id}"})
@Schema(StripeRefundSchema)
export class StripeRefundDataType {}
