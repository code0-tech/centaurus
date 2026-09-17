import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";

// See https://mailchimp.com/developer/marketing/guides/sync-audience-data-with-webhooks/
export const MailchimpUnsubscribeWebhookPayloadSchema = z.object({
    type: z.literal("unsubscribe"),
    fired_at: z.string().optional(),
    data: z.object({
        action: z.string().optional().describe("How the member was unsubscribed, e.g. 'unsub' or 'delete'."),
        reason: z.string().optional().describe("The reason given for unsubscribing, if any."),
        id: z.string().optional().describe("The MD5 hash of the lowercase version of the member's email address."),
        list_id: z.string().optional().describe("The audience (list) id this event fired for."),
        email: z.string().describe("The member's email address."),
        email_type: z.string().optional(),
        merges: z.record(z.string(), z.any()).optional(),
        ip_opt: z.string().optional(),
        campaign_id: z.string().optional().describe("The campaign id that led to the unsubscribe, if any."),
    }),
});
export type MailchimpUnsubscribeWebhookPayloadType = z.infer<typeof MailchimpUnsubscribeWebhookPayloadSchema>;

@Identifier("MailchimpUnsubscribeWebhookPayload")
@Name({code: "en-US", content: "MailchimpUnsubscribeWebhookPayload"})
@Schema(MailchimpUnsubscribeWebhookPayloadSchema)
export class MailchimpUnsubscribeWebhookPayload {}
