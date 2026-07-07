import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemaForWebhook} from "shopify-webhook-schemas";
import { z } from "zod";

const schema = schemaForWebhook("2026-04", "fulfillments/update");
const ShopifyFulfillmentsUpdatePayloadSchema = z.fromJSONSchema(schema);

@Identifier("ShopifyFulfillmentsUpdateWebhookPayload")
@Name({ code: "en-US", content: "ShopifyFulfillmentsUpdateWebhookPayload" })
@Schema(ShopifyFulfillmentsUpdatePayloadSchema)
export class ShopifyFulfillmentsUpdateWebhookPayload {}
