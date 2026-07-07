import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemaForWebhook} from "shopify-webhook-schemas";
import { z } from "zod";

const schema = schemaForWebhook("2026-04", "fulfillments/create");
const ShopifyFulfillmentsCreatePayloadSchema = z.fromJSONSchema(schema);

@Identifier("ShopifyFulfillmentsCreateWebhookPayload")
@Name({ code: "en-US", content: "ShopifyFulfillmentsCreateWebhookPayload" })
@Schema(ShopifyFulfillmentsCreatePayloadSchema)
export class ShopifyFulfillmentsCreateWebhookPayload {}
