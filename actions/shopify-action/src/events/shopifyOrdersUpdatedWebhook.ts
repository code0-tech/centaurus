import {Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature} from "@code0-tech/hercules";

@Identifier("ShopifyOrdersUpdatedWebhook")
@DisplayIcon("simple:shopify")
@Name({ code: "en-US", content: "Shopify orders updated" })
@Description({ code: "en-US", content: "Triggered when an order is updated in Shopify." })
@DisplayMessage({ code: "en-US", content: "Shopify orders updated on ${httpURL}" })
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: ShopifyOrdersUpdatedWebhookPayload): REST_ADAPTER_INPUT<ShopifyOrdersUpdatedWebhookPayload>")
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
export class ShopifyOrdersUpdatedWebhook extends Rest {}
