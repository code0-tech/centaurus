import {Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature} from "@code0-tech/hercules";

@Identifier("MailchimpProfileUpdated")
@DisplayIcon("simple:mailchimp")
@Name({code: "en-US", content: "Mailchimp member profile updated"})
@Description({code: "en-US", content: "Triggered when a member's profile or merge fields change in a watched Mailchimp audience (webhook type: profile)."})
@DisplayMessage({code: "en-US", content: "Mailchimp member profile updated on ${http_url}"})
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: MailchimpProfileWebhookPayload): REST_ADAPTER_INPUT<MailchimpProfileWebhookPayload>")
@EventSetting({
    identifier: "input_schema",
    hidden: true
})
@EventSetting({
    identifier: "http_method",
    hidden: true,
    defaultValue: "POST"
})
@EventSetting({
    identifier: "http_schema",
    hidden: true,
    defaultValue: "application/x-www-form-urlencoded"
})
export class MailchimpProfileUpdated extends Rest {}
