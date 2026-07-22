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
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: StripePaymentIntentSucceededWebhookPayload): REST_ADAPTER_INPUT<StripePaymentIntentSucceededWebhookPayload>")
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
    defaultValue: "application/json"
})
export class StripePaymentIntentSucceededWebhook extends Rest {
}
