import {Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature} from "@code0-tech/hercules";

@Identifier("MailchimpUnsubscribed")
@DisplayIcon("simple:mailchimp")
@Name({code: "en-US", content: "Mailchimp member unsubscribed"})
@Description({code: "en-US", content: "Triggered when a member unsubscribes from a watched Mailchimp audience (webhook type: unsubscribe)."})
@DisplayMessage({code: "en-US", content: "Mailchimp member unsubscribed on ${httpURL}"})
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: MailchimpUnsubscribeWebhookPayload): REST_ADAPTER_INPUT<MailchimpUnsubscribeWebhookPayload>")
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
export class MailchimpUnsubscribed extends Rest {}
