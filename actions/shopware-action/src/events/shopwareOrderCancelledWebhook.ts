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

@Identifier("ShopwareOrderCancelledWebhook")
@DisplayIcon("simple:shopware")
@Name({code: "en-US", content: "Shopware order cancelled"})
@Description({code: "en-US", content: "Triggered when an order enters the cancelled state in Shopware (state_enter.order.state.cancelled)."})
@DisplayMessage({code: "en-US", content: "Shopware order cancelled on ${httpURL}"})
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: ShopwareOrderCancelledWebhookPayload): REST_ADAPTER_INPUT<ShopwareOrderCancelledWebhookPayload>")
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
export class ShopwareOrderCancelledWebhook extends Rest {
}
