import {DisplayMessage, Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";
import {schemas} from "../generated/stripe-schemas.ts";

/**
 * STRIPE_REFUND is generated from Stripe's official OpenAPI spec
 * (stripe/openapi, openapi/spec3.sdk.json). The spec is filtered down to the
 * `refund` component (see scripts/filterStripeSpec.mjs) and converted to a
 * zod schema by openapi-zod-client. Regenerate with
 * `npm run generate:stripe-schemas`.
 */
export const StripeRefundSchema = schemas.refund;
export type StripeRefund = z.infer<typeof StripeRefundSchema>;

@Identifier("STRIPE_REFUND")
@Name({code: "en-US", content: "Stripe refund"})
@DisplayMessage({code: "en-US", content: "Stripe refund ${id}"})
@Schema(StripeRefundSchema)
export class StripeRefundDataType {}
