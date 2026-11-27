import { Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { HubSpotWebhookEventSchema } from "./hubspotWebhookEvent.js";

/**
 * Body of a HubSpot `contact.propertyChange` webhook delivery. HubSpot batches events, so
 * the body is a JSON array of change events (up to 100 per request).
 */
export const HubSpotContactPropertyChangedWebhookPayloadSchema = z.array(
    HubSpotWebhookEventSchema.extend({
        subscriptionType: z.string().describe("The subscription type (`contact.propertyChange`)."),
        objectId: z.number().describe("The id of the changed contact."),
        propertyName: z.string().describe("The name of the changed property."),
        propertyValue: z.string().describe("The new value of the property."),
    })
);
export type HubSpotContactPropertyChangedWebhookPayload = z.infer<typeof HubSpotContactPropertyChangedWebhookPayloadSchema>;

@Identifier("HubSpotContactPropertyChangedWebhookPayload")
@Name({ code: "en-US", content: "HubSpot contact property changed webhook payload" })
@Schema(HubSpotContactPropertyChangedWebhookPayloadSchema)
export class HubSpotContactPropertyChangedWebhookPayloadDataType {}
