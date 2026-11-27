import { Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { HubSpotWebhookEventSchema } from "./hubspotWebhookEvent.js";

/**
 * Body of a HubSpot `deal.creation` webhook delivery. HubSpot batches events, so
 * the body is a JSON array of change events (up to 100 per request).
 */
export const HubSpotDealCreatedWebhookPayloadSchema = z.array(
    HubSpotWebhookEventSchema.extend({
        subscriptionType: z.string().describe("The subscription type (`deal.creation`)."),
        objectId: z.number().describe("The id of the created deal."),
        
    })
);
export type HubSpotDealCreatedWebhookPayload = z.infer<typeof HubSpotDealCreatedWebhookPayloadSchema>;

@Identifier("HubSpotDealCreatedWebhookPayload")
@Name({ code: "en-US", content: "HubSpot deal created webhook payload" })
@Schema(HubSpotDealCreatedWebhookPayloadSchema)
export class HubSpotDealCreatedWebhookPayloadDataType {}
