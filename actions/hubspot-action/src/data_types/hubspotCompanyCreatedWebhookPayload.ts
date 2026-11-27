import { Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { HubSpotWebhookEventSchema } from "./hubspotWebhookEvent.js";

/**
 * Body of a HubSpot `company.creation` webhook delivery. HubSpot batches events, so
 * the body is a JSON array of change events (up to 100 per request).
 */
export const HubSpotCompanyCreatedWebhookPayloadSchema = z.array(
    HubSpotWebhookEventSchema.extend({
        subscriptionType: z.string().describe("The subscription type (`company.creation`)."),
        objectId: z.number().describe("The id of the created company."),
        
    })
);
export type HubSpotCompanyCreatedWebhookPayload = z.infer<typeof HubSpotCompanyCreatedWebhookPayloadSchema>;

@Identifier("HubSpotCompanyCreatedWebhookPayload")
@Name({ code: "en-US", content: "HubSpot company created webhook payload" })
@Schema(HubSpotCompanyCreatedWebhookPayloadSchema)
export class HubSpotCompanyCreatedWebhookPayloadDataType {}
