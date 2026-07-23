import { Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * A single HubSpot app-webhook change event. HubSpot delivers webhook
 * subscriptions as a JSON array of these event objects; the Rest trigger
 * exposes the individual event to the flow. The schema is intentionally
 * permissive (most fields optional) because the exact set of fields depends on
 * the `subscriptionType` (property-change events carry `propertyName` /
 * `propertyValue`, creation events do not).
 * See https://developers.hubspot.com/docs/api/webhooks
 */
export const HubSpotWebhookEventSchema = z.object({
    eventId: z.number().optional(),
    subscriptionId: z.number().optional(),
    portalId: z.number().optional(),
    appId: z.number().optional(),
    occurredAt: z.number().optional(),
    subscriptionType: z.string().optional(),
    attemptNumber: z.number().optional(),
    objectId: z.number().optional(),
    changeSource: z.string().optional(),
    changeFlag: z.string().optional(),
    propertyName: z.string().optional(),
    propertyValue: z.string().optional(),
});
export type HubSpotWebhookEvent = z.infer<typeof HubSpotWebhookEventSchema>;

@Identifier("HUBSPOT_WEBHOOK_EVENT")
@Name({ code: "en-US", content: "HubSpot webhook event" })
@Schema(HubSpotWebhookEventSchema)
export class HubSpotWebhookEventDataType {}
