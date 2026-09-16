import {DisplayMessage, Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";

// See https://mailchimp.com/developer/marketing/api/campaigns/get-campaign-info/
export const MailchimpCampaignSchema = z.object({
    id: z.string().describe("The campaign id."),
    web_id: z.number().optional().describe("The ID used in the Mailchimp web application."),
    type: z.string().optional().describe("The campaign type, e.g. 'regular'."),
    status: z.string().optional().describe("The campaign status, e.g. 'save', 'sending', 'sent'."),
    recipients: z
        .object({
            list_id: z.string().optional(),
            list_name: z.string().optional(),
            recipient_count: z.number().optional(),
        })
        .optional(),
    settings: z
        .object({
            subject_line: z.string().optional(),
            title: z.string().optional(),
            from_name: z.string().optional(),
            reply_to: z.string().optional(),
        })
        .optional(),
    create_time: z.string().optional(),
    send_time: z.string().nullish(),
    archive_url: z.string().optional().describe("The link to the campaign's archive version."),
    long_archive_url: z.string().optional(),
});
export type MailchimpCampaign = z.infer<typeof MailchimpCampaignSchema>;

@Identifier("MAILCHIMP_CAMPAIGN")
@Name({code: "en-US", content: "Mailchimp campaign"})
@DisplayMessage({code: "en-US", content: "Mailchimp campaign ${id}"})
@Schema(MailchimpCampaignSchema)
export class MailchimpCampaignDataType {}
