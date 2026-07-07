import {Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature} from "@code0-tech/hercules";

@Identifier("ShopifyOrdersFulfilledWebhook")
@DisplayIcon("simple:shopify")
@Name({ code: "en-US", content: "Shopify orders fulfilled" })
@Description({ code: "en-US", content: "Triggered when an order is fulfilled in Shopify." })
@DisplayMessage({ code: "en-US", content: "Shopify orders fulfilled on ${httpURL}" })
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: ShopifyOrdersFulfilledWebhookPayload): REST_ADAPTER_INPUT<ShopifyOrdersFulfilledWebhookPayload>")
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
export class ShopifyOrdersFulfilledWebhook extends Rest {}
