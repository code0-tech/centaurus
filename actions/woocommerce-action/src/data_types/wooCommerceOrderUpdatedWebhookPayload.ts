import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/woocommerce-schemas.ts";

const WooCommerceOrderUpdatedPayloadSchema = schemas.Order;

@Identifier("WooCommerceOrderUpdatedWebhookPayload")
@Name({code: "en-US", content: "WooCommerceOrderUpdatedWebhookPayload"})
@Schema(WooCommerceOrderUpdatedPayloadSchema)
export class WooCommerceOrderUpdatedWebhookPayload {
}
