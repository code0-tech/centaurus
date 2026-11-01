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
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: ShopwareOrderPaidWebhookPayload): REST_ADAPTER_INPUT<ShopwareOrderPaidWebhookPayload>")
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
export class ShopwareOrderPaidWebhook extends Rest {
}
