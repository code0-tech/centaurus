import {DisplayIcon, DisplayMessage, EventSetting, Identifier, Rest, Signature} from "@code0-tech/hercules";

@Identifier("ShopifyOrdersCreateWebhook")
@DisplayIcon("simple:shopify")
@DisplayMessage({ code: "en-US", content: "Shopify orders create on ${httpURL}" })
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: ShopifyOrdersCreateWebhookPayload): REST_ADAPTER_INPUT<ShopifyOrdersCreateWebhookPayload>")
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
export class ShopifyOrdersCreateWebhook extends Rest {}