import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";

// See https://mailchimp.com/developer/marketing/guides/sync-audience-data-with-webhooks/
export const MailchimpCleanedWebhookPayloadSchema = z.object({
    type: z.literal("cleaned"),
    fired_at: z.string().optional(),
    data: z.object({
        list_id: z.string().optional().describe("The audience (list) id this event fired for."),
        campaign_id: z.string().optional().describe("The campaign id that caused the address to be cleaned, if any."),
        reason: z.enum(["hard", "abuse"]).optional().describe("Why the address was cleaned."),
        email: z.string().describe("The address that was cleaned."),
    }),
});
export type MailchimpCleanedWebhookPayloadType = z.infer<typeof MailchimpCleanedWebhookPayloadSchema>;

@Identifier("MailchimpCleanedWebhookPayload")
@Name({code: "en-US", content: "MailchimpCleanedWebhookPayload"})
@Schema(MailchimpCleanedWebhookPayloadSchema)
export class MailchimpCleanedWebhookPayload {}
