import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemaForWebhook} from "shopify-webhook-schemas";
import { z } from "zod";

const schema = schemaForWebhook("2026-04", "orders/paid");
const ShopifyOrdersPaidPayloadSchema = z.fromJSONSchema(schema);

@Identifier("ShopifyOrdersPaidWebhookPayload")
@Name({ code: "en-US", content: "ShopifyOrdersPaidWebhookPayload" })
@Schema(ShopifyOrdersPaidPayloadSchema)
export class ShopifyOrdersPaidWebhookPayload {}
