import {DisplayMessage, Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";
import {MailchimpTagSchema} from "./mailchimpTag.ts";

// See https://mailchimp.com/developer/marketing/api/list-members/
export const MailchimpMemberSchema = z.object({
    id: z.string().optional().describe("The MD5 hash of the lowercase version of the member's email address."),
    email_address: z.string().describe("The member's email address."),
    email_type: z.string().nullish().describe("Type of email this member asked to get ('html' or 'text')."),
    status: z
        .enum(["subscribed", "unsubscribed", "cleaned", "pending", "transactional"])
        .describe("The member's subscription status."),
    merge_fields: z.record(z.string(), z.any()).optional().describe("A dictionary of merge fields keyed by tag name."),
    tags: z.array(MailchimpTagSchema).optional().describe("Tags applied to the member."),
    list_id: z.string().optional().describe("The audience (list) id this member belongs to."),
    unique_email_id: z.string().optional(),
    web_id: z.number().optional().describe("The ID used in the Mailchimp web application."),
    timestamp_signup: z.string().nullish().describe("The date/time the member signed up, in ISO 8601 format."),
    timestamp_opt: z.string().nullish().describe("The date/time the member confirmed their opt-in status."),
    member_rating: z.number().optional().describe("A rating from 1-5 of the member's engagement."),
    last_changed: z.string().optional().describe("The date/time the member's info was last changed."),
    language: z.string().nullish().describe("The ISO 639-1 language code the member selected."),
    vip: z.boolean().optional().describe("Whether the member is a VIP."),
    email_client: z.string().optional(),
    ip_signup: z.string().nullish().describe("The IP address the member signed up from."),
    ip_opt: z.string().nullish().describe("The IP address the member used to confirm their opt-in status."),
});
export type MailchimpMember = z.infer<typeof MailchimpMemberSchema>;

@Identifier("MAILCHIMP_MEMBER")
@Name({code: "en-US", content: "Mailchimp member"})
@DisplayMessage({code: "en-US", content: "Mailchimp member ${email_address}"})
@Schema(MailchimpMemberSchema)
export class MailchimpMemberDataType {}
