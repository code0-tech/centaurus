import {Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature} from "@code0-tech/hercules";

@Identifier("MailchimpProfileUpdated")
@DisplayIcon("simple:mailchimp")
@Name({code: "en-US", content: "Mailchimp member profile updated"})
@Description({code: "en-US", content: "Triggered when a member's profile or merge fields change in a watched Mailchimp audience (webhook type: profile)."})
@DisplayMessage({code: "en-US", content: "Mailchimp member profile updated on ${httpURL}"})
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: MailchimpProfileWebhookPayload): REST_ADAPTER_INPUT<MailchimpProfileWebhookPayload>")
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
export class MailchimpProfileUpdated extends Rest {}
