import {Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature} from "@code0-tech/hercules";

@Identifier("ShopifyFulfillmentsUpdateWebhook")
@DisplayIcon("simple:shopify")
@Name({ code: "en-US", content: "Shopify fulfillments update" })
@Description({ code: "en-US", content: "Triggered when a fulfillment is updated in Shopify." })
@DisplayMessage({ code: "en-US", content: "Shopify fulfillments update on ${httpURL}" })
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: ShopifyFulfillmentsUpdateWebhookPayload): REST_ADAPTER_INPUT<ShopifyFulfillmentsUpdateWebhookPayload>")
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
export class ShopifyFulfillmentsUpdateWebhook extends Rest {}
