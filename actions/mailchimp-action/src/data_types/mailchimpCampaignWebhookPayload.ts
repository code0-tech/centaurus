import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";

// See https://mailchimp.com/developer/marketing/guides/sync-audience-data-with-webhooks/
export const MailchimpCampaignWebhookPayloadSchema = z.object({
    type: z.literal("campaign"),
    fired_at: z.string().optional(),
    data: z.object({
        id: z.string().optional().describe("The campaign id."),
        subject: z.string().optional().describe("The campaign's subject line."),
        status: z.string().optional().describe("The campaign's status, e.g. 'sent'."),
        reason: z.string().optional().describe("The reason for the status, if applicable (e.g. abuse report threshold)."),
        list_id: z.string().optional().describe("The audience (list) id the campaign was sent to."),
    }),
});
export type MailchimpCampaignWebhookPayloadType = z.infer<typeof MailchimpCampaignWebhookPayloadSchema>;

@Identifier("MailchimpCampaignWebhookPayload")
@Name({code: "en-US", content: "MailchimpCampaignWebhookPayload"})
@Schema(MailchimpCampaignWebhookPayloadSchema)
export class MailchimpCampaignWebhookPayload {}
