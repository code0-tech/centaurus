import {Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature} from "@code0-tech/hercules";

@Identifier("MailchimpCampaignSent")
@DisplayIcon("simple:mailchimp")
@Name({code: "en-US", content: "Mailchimp campaign sent"})
@Description({code: "en-US", content: "Triggered when a campaign finishes sending for a watched Mailchimp audience (webhook type: campaign)."})
@DisplayMessage({code: "en-US", content: "Mailchimp campaign sent on ${httpURL}"})
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: MailchimpCampaignWebhookPayload): REST_ADAPTER_INPUT<MailchimpCampaignWebhookPayload>")
@EventSetting({
    identifier: "input_schema",
    hidden: true
})
@EventSetting({
    identifier: "httpMethod",
    hidden: true,
    defaultValue: "POST"
})
@EventSetting({
    identifier: "httpSchema",
    hidden: true,
    defaultValue: "application/x-www-form-urlencoded"
})
export class MailchimpCampaignSent extends Rest {}
