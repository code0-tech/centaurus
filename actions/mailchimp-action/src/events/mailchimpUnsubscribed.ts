import {Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature} from "@code0-tech/hercules";

@Identifier("MailchimpUnsubscribed")
@DisplayIcon("simple:mailchimp")
@Name({code: "en-US", content: "Mailchimp member unsubscribed"})
@Description({code: "en-US", content: "Triggered when a member unsubscribes from a watched Mailchimp audience (webhook type: unsubscribe)."})
@DisplayMessage({code: "en-US", content: "Mailchimp member unsubscribed on ${http_url}"})
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: MailchimpUnsubscribeWebhookPayload): REST_ADAPTER_INPUT<MailchimpUnsubscribeWebhookPayload>")
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
export class MailchimpUnsubscribed extends Rest {}
