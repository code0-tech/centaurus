import {
    Description,
    DisplayIcon,
    DisplayMessage,
    EventSetting,
    Identifier,
    Name,
    Rest,
    Signature
} from "@code0-tech/hercules";

@Identifier("WooCommerceOrderUpdatedWebhook")
@DisplayIcon("simple:woo")
@Name({code: "en-US", content: "WooCommerce order updated"})
@Description({
    code: "en-US",
    content: "Triggered when an order is updated in WooCommerce, including all status changes such as paid, cancelled or refunded. Check the status field of the payload to distinguish between them."
})
@DisplayMessage({code: "en-US", content: "WooCommerce order updated on ${httpURL}"})
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: WooCommerceOrderUpdatedWebhookPayload): REST_ADAPTER_INPUT<WooCommerceOrderUpdatedWebhookPayload>")
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
export class WooCommerceOrderUpdatedWebhook extends Rest {
}
