import {Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature} from "@code0-tech/hercules";

@Identifier("MailchimpSubscribed")
@DisplayIcon("simple:mailchimp")
@Name({code: "en-US", content: "Mailchimp member subscribed"})
@Description({code: "en-US", content: "Triggered when a member subscribes to a watched Mailchimp audience (webhook type: subscribe)."})
@DisplayMessage({code: "en-US", content: "Mailchimp member subscribed on ${httpURL}"})
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: MailchimpSubscribeWebhookPayload): REST_ADAPTER_INPUT<MailchimpSubscribeWebhookPayload>")
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
export class MailchimpSubscribed extends Rest {}
