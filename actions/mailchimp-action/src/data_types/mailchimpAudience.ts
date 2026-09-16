import {DisplayMessage, Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";

// See https://mailchimp.com/developer/marketing/api/lists/get-list-info/
export const MailchimpAudienceSchema = z.object({
    id: z.string().describe("The audience (list) id."),
    name: z.string().describe("The name of the audience."),
    permission_reminder: z.string().optional(),
    email_type_option: z.boolean().optional().describe("Whether the audience supports multiple formats for emails."),
    contact: z
        .object({
            company: z.string().optional(),
            address1: z.string().optional(),
            address2: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zip: z.string().optional(),
            country: z.string().optional(),
        })
        .optional()
        .describe("The contact information the audience is using, required by CAN-SPAM."),
    stats: z
        .object({
            member_count: z.number().optional(),
            unsubscribe_count: z.number().optional(),
            cleaned_count: z.number().optional(),
            member_count_since_send: z.number().optional(),
            campaign_count: z.number().optional(),
            campaign_last_sent: z.string().nullish(),
            merge_field_count: z.number().optional(),
            avg_sub_rate: z.number().optional(),
            avg_unsub_rate: z.number().optional(),
            target_sub_rate: z.number().optional(),
            open_rate: z.number().optional(),
            click_rate: z.number().optional(),
            last_sub_date: z.string().nullish(),
            last_unsub_date: z.string().nullish(),
        })
        .optional()
        .describe("Stats for the audience."),
    date_created: z.string().optional(),
    list_rating: z.number().optional(),
    visibility: z.string().optional().describe("Whether this audience is 'pub'lic or 'prv'ate."),
});
export type MailchimpAudience = z.infer<typeof MailchimpAudienceSchema>;

@Identifier("MAILCHIMP_AUDIENCE")
@Name({code: "en-US", content: "Mailchimp audience"})
@DisplayMessage({code: "en-US", content: "Mailchimp audience ${name}"})
@Schema(MailchimpAudienceSchema)
export class MailchimpAudienceDataType {}
