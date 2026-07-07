import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/woocommerce-schemas.ts";

const WooCommerceOrderCreatedPayloadSchema = schemas.Order;

@Identifier("WooCommerceOrderCreatedWebhookPayload")
@Name({code: "en-US", content: "WooCommerceOrderCreatedWebhookPayload"})
@Schema(WooCommerceOrderCreatedPayloadSchema)
export class WooCommerceOrderCreatedWebhookPayload {
}
