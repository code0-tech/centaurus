import {
    Description,
    DisplayIcon,
    DisplayMessage,
    EventSetting,
    Identifier,
    Name,
    Rest,
    Signature,
} from "@code0-tech/hercules";

@Identifier("StripePaymentIntentSucceededWebhook")
@DisplayIcon("simple:stripe")
@Name({code: "en-US", content: "Stripe payment intent succeeded"})
@Description({code: "en-US", content: "Triggered when a PaymentIntent succeeds in Stripe (payment_intent.succeeded)."})
@DisplayMessage({code: "en-US", content: "Stripe payment intent succeeded on ${httpURL}"})
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: StripePaymentIntentSucceededWebhookPayload): REST_ADAPTER_INPUT<StripePaymentIntentSucceededWebhookPayload>")
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
    defaultValue: "application/json"
})
export class StripePaymentIntentSucceededWebhook extends Rest {
}
