import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import {getMailchimpClient, toRuntimeError} from "../helpers.ts";
import {MailchimpCampaign, MailchimpCampaignSchema} from "../data_types/mailchimpCampaign.ts";

@Identifier("mailchimpCreateCampaign")
@DisplayIcon("simple:mailchimp")
@Signature("(audienceId: string, subject: string, fromName: string, replyTo: string, htmlContent: string): MAILCHIMP_CAMPAIGN")
@Name({code: "en-US", content: "Create campaign"})
@DisplayMessage({code: "en-US", content: "Create Mailchimp campaign ${subject}"})
@Documentation({
    code: "en-US",
    content:
        "Creates a regular Mailchimp campaign targeting an audience and sets its HTML content. The campaign is saved as a draft; use `mailchimpSendCampaign` to send it.",
})
@Description({
    code: "en-US",
    content: "Creates a Mailchimp campaign and sets its HTML content.",
})
@Parameter({
    runtimeName: "audienceId",
    name: [{code: "en-US", content: "Audience ID"}],
    description: [{code: "en-US", content: "The id of the Mailchimp audience (list) to send the campaign to."}],
})
@Parameter({
    runtimeName: "subject",
    name: [{code: "en-US", content: "Subject"}],
    description: [{code: "en-US", content: "The campaign's subject line."}],
})
@Parameter({
    runtimeName: "fromName",
    name: [{code: "en-US", content: "From name"}],
    description: [{code: "en-US", content: "The from name on the campaign's emails."}],
})
@Parameter({
    runtimeName: "replyTo",
    name: [{code: "en-US", content: "Reply-to"}],
    description: [{code: "en-US", content: "The reply-to email address on the campaign's emails."}],
})
@Parameter({
    runtimeName: "htmlContent",
    name: [{code: "en-US", content: "HTML content"}],
    description: [{code: "en-US", content: "The campaign's HTML body."}],
})
export class CreateCampaignFunction {
    async run(
        context: FunctionContext,
        audienceId: string,
        subject: string,
        fromName: string,
        replyTo: string,
        htmlContent: string
    ): Promise<MailchimpCampaign> {
        const client = getMailchimpClient(context);
        try {
            const created = await client.campaigns.create({
                type: "regular",
                recipients: {list_id: audienceId},
                settings: {subject_line: subject, title: subject, from_name: fromName, reply_to: replyTo},
            });
            const campaign = MailchimpCampaignSchema.parse(created);
            await client.campaigns.setContent(campaign.id, {html: htmlContent});
            return campaign;
        } catch (error) {
            throw toRuntimeError("MAILCHIMP_CREATE_CAMPAIGN_FAILED", error);
        }
    }
}
