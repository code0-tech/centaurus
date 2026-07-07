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

@Identifier("ShopwareOrderPaidWebhook")
@DisplayIcon("simple:shopware")
@Name({code: "en-US", content: "Shopware order paid"})
@Description({code: "en-US", content: "Triggered when an order transaction enters the paid state in Shopware (state_enter.order_transaction.state.paid)."})
@DisplayMessage({code: "en-US", content: "Shopware order paid on ${httpURL}"})
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: ShopwareOrderPaidWebhookPayload): REST_ADAPTER_INPUT<ShopwareOrderPaidWebhookPayload>")
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
export class ShopwareOrderPaidWebhook extends Rest {
}
