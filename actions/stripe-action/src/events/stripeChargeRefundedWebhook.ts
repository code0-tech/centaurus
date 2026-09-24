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

@Identifier("StripeChargeRefundedWebhook")
@DisplayIcon("simple:stripe")
@Name({code: "en-US", content: "Stripe charge refunded"})
@Description({code: "en-US", content: "Triggered when a charge is refunded in Stripe (charge.refunded)."})
@DisplayMessage({code: "en-US", content: "Stripe charge refunded on ${httpURL}"})
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: StripeChargeRefundedWebhookPayload): REST_ADAPTER_INPUT<StripeChargeRefundedWebhookPayload>")
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
export class StripeChargeRefundedWebhook extends Rest {
}
