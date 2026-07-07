import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemaForWebhook} from "shopify-webhook-schemas";
import { z } from "zod";

const schema = schemaForWebhook("2026-04", "orders/cancelled");
const ShopifyOrdersCancelledPayloadSchema = z.fromJSONSchema(schema);

@Identifier("ShopifyOrdersCancelledWebhookPayload")
@Name({ code: "en-US", content: "ShopifyOrdersCancelledWebhookPayload" })
@Schema(ShopifyOrdersCancelledPayloadSchema)
export class ShopifyOrdersCancelledWebhookPayload {}
