import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";

// Mailchimp audience webhooks are delivered as `application/x-www-form-urlencoded`
// POSTs with bracket-notation keys (e.g. `data[email]`, `data[merges][FNAME]`)
// which the REST adapter expands into the nested shape below.
// See https://mailchimp.com/developer/marketing/guides/sync-audience-data-with-webhooks/
export const MailchimpSubscribeWebhookPayloadSchema = z.object({
    type: z.literal("subscribe"),
    fired_at: z.string().optional().describe("The date/time the webhook was fired, in 'YYYY-MM-DD HH:mm:ss' format."),
    data: z.object({
        id: z.string().optional().describe("The MD5 hash of the lowercase version of the member's email address."),
        list_id: z.string().optional().describe("The audience (list) id this event fired for."),
        email: z.string().describe("The member's email address."),
        email_type: z.string().optional(),
        ip_opt: z.string().optional().describe("The IP address used to opt in."),
        ip_signup: z.string().optional().describe("The IP address used to sign up."),
        web_id: z.string().optional(),
        merges: z.record(z.string(), z.any()).optional().describe("The member's merge fields at the time of the event."),
    }),
});
export type MailchimpSubscribeWebhookPayloadType = z.infer<typeof MailchimpSubscribeWebhookPayloadSchema>;

@Identifier("MailchimpSubscribeWebhookPayload")
@Name({code: "en-US", content: "MailchimpSubscribeWebhookPayload"})
@Schema(MailchimpSubscribeWebhookPayloadSchema)
export class MailchimpSubscribeWebhookPayload {}
