import { Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { HubSpotWebhookEventSchema } from "./hubspotWebhookEvent.js";

/**
 * Body of a HubSpot `contact.creation` webhook delivery. HubSpot batches events, so
 * the body is a JSON array of change events (up to 100 per request).
 */
export const HubSpotContactCreatedWebhookPayloadSchema = z.array(
    HubSpotWebhookEventSchema.extend({
        subscriptionType: z.string().describe("The subscription type (`contact.creation`)."),
        objectId: z.number().describe("The id of the created contact."),
        
    })
);
export type HubSpotContactCreatedWebhookPayload = z.infer<typeof HubSpotContactCreatedWebhookPayloadSchema>;

@Identifier("HubSpotContactCreatedWebhookPayload")
@Name({ code: "en-US", content: "HubSpot contact created webhook payload" })
@Schema(HubSpotContactCreatedWebhookPayloadSchema)
export class HubSpotContactCreatedWebhookPayloadDataType {}
