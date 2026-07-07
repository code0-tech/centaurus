import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemaForWebhook} from "shopify-webhook-schemas";
import { z } from "zod";

const schema = schemaForWebhook("2026-04", "orders/fulfilled");
const ShopifyOrdersFulfilledPayloadSchema = z.fromJSONSchema(schema);

@Identifier("ShopifyOrdersFulfilledWebhookPayload")
@Name({ code: "en-US", content: "ShopifyOrdersFulfilledWebhookPayload" })
@Schema(ShopifyOrdersFulfilledPayloadSchema)
export class ShopifyOrdersFulfilledWebhookPayload {}
