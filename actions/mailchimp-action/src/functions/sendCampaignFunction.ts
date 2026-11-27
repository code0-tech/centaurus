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

@Identifier("mailchimpSendCampaign")
@DisplayIcon("simple:mailchimp")
@Signature("(campaignId: string): boolean")
@Name({code: "en-US", content: "Send campaign"})
@DisplayMessage({code: "en-US", content: "Send Mailchimp campaign ${campaignId}"})
@Documentation({
    code: "en-US",
    content: "Sends a saved Mailchimp campaign to its audience immediately.",
})
@Description({
    code: "en-US",
    content: "Sends a Mailchimp campaign to its audience.",
})
@Parameter({
    runtimeName: "campaignId",
    name: [{code: "en-US", content: "Campaign ID"}],
    description: [{code: "en-US", content: "The id of the campaign to send."}],
})
export class SendCampaignFunction {
    async run(context: FunctionContext, campaignId: string): Promise<boolean> {
        const client = getMailchimpClient(context);
        try {
            await client.campaigns.send(campaignId);
            return true;
        } catch (error) {
            throw toRuntimeError("MAILCHIMP_SEND_CAMPAIGN_FAILED", error);
        }
    }
}
