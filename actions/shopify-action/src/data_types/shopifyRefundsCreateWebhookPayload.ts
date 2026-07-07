import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemaForWebhook} from "shopify-webhook-schemas";
import { z } from "zod";

const schema = schemaForWebhook("2026-04", "refunds/create");
const ShopifyRefundsCreatePayloadSchema = z.fromJSONSchema(schema);

@Identifier("ShopifyRefundsCreateWebhookPayload")
@Name({ code: "en-US", content: "ShopifyRefundsCreateWebhookPayload" })
@Schema(ShopifyRefundsCreatePayloadSchema)
export class ShopifyRefundsCreateWebhookPayload {}
