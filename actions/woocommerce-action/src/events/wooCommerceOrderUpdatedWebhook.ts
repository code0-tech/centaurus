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
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: WooCommerceOrderUpdatedWebhookPayload): REST_ADAPTER_INPUT<WooCommerceOrderUpdatedWebhookPayload>")
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
export class WooCommerceOrderUpdatedWebhook extends Rest {
}
