import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";

// See https://mailchimp.com/developer/marketing/guides/sync-audience-data-with-webhooks/
export const MailchimpProfileWebhookPayloadSchema = z.object({
    type: z.literal("profile"),
    fired_at: z.string().optional(),
    data: z.object({
        id: z.string().optional().describe("The MD5 hash of the lowercase version of the member's email address."),
        list_id: z.string().optional().describe("The audience (list) id this event fired for."),
        email: z.string().describe("The member's email address."),
        email_type: z.string().optional(),
        ip_opt: z.string().optional(),
        merges: z.record(z.string(), z.any()).optional().describe("The member's merge fields after the update."),
    }),
});
export type MailchimpProfileWebhookPayloadType = z.infer<typeof MailchimpProfileWebhookPayloadSchema>;

@Identifier("MailchimpProfileWebhookPayload")
@Name({code: "en-US", content: "MailchimpProfileWebhookPayload"})
@Schema(MailchimpProfileWebhookPayloadSchema)
export class MailchimpProfileWebhookPayload {}
