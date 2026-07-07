import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemaForWebhook} from "shopify-webhook-schemas";
import { z } from "zod";

const schema = schemaForWebhook("2026-04", "orders/create");
const ShopifyOrdersCreatePayloadSchema = z.fromJSONSchema(schema);

@Identifier("ShopifyOrdersCreateWebhookPayload")
@Name({ code: "en-US", content: "ShopifyOrdersCreateWebhookPayload" })
@Schema(ShopifyOrdersCreatePayloadSchema)
export class ShopifyOrdersCreateWebhookPayload {}