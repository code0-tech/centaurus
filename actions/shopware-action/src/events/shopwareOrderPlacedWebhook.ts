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

@Identifier("ShopwareOrderPlacedWebhook")
@DisplayIcon("simple:shopware")
@Name({code: "en-US", content: "Shopware order placed"})
@Description({code: "en-US", content: "Triggered when an order is placed in Shopware (checkout.order.placed)."})
@DisplayMessage({code: "en-US", content: "Shopware order placed on ${httpURL}"})
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: ShopwareOrderPlacedWebhookPayload): REST_ADAPTER_INPUT<ShopwareOrderPlacedWebhookPayload>")
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
export class ShopwareOrderPlacedWebhook extends Rest {
}
