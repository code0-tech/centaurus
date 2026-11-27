import { Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { HubSpotWebhookEventSchema } from "./hubspotWebhookEvent.js";

/**
 * Body of a HubSpot `deal.propertyChange` webhook delivery. HubSpot batches events, so
 * the body is a JSON array of change events (up to 100 per request).
 */
export const HubSpotDealStageChangedWebhookPayloadSchema = z.array(
    HubSpotWebhookEventSchema.extend({
        subscriptionType: z.string().describe("The subscription type (`deal.propertyChange`)."),
        objectId: z.number().describe("The id of the changed deal."),
        propertyName: z.string().describe("The name of the changed property."),
        propertyValue: z.string().describe("The new value of the property."),
    })
);
export type HubSpotDealStageChangedWebhookPayload = z.infer<typeof HubSpotDealStageChangedWebhookPayloadSchema>;

@Identifier("HubSpotDealStageChangedWebhookPayload")
@Name({ code: "en-US", content: "HubSpot deal stage changed webhook payload" })
@Schema(HubSpotDealStageChangedWebhookPayloadSchema)
export class HubSpotDealStageChangedWebhookPayloadDataType {}
