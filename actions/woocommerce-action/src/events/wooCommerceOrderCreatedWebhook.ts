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

@Identifier("WooCommerceOrderCreatedWebhook")
@DisplayIcon("simple:woo")
@Name({code: "en-US", content: "WooCommerce order created"})
@Description({code: "en-US", content: "Triggered when a new order is created in WooCommerce."})
@DisplayMessage({code: "en-US", content: "WooCommerce order created on ${httpURL}"})
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: WooCommerceOrderCreatedWebhookPayload): REST_ADAPTER_INPUT<WooCommerceOrderCreatedWebhookPayload>")
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
export class WooCommerceOrderCreatedWebhook extends Rest {
}
