import {Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature} from "@code0-tech/hercules";

@Identifier("ShopifyOrdersCancelledWebhook")
@DisplayIcon("simple:shopify")
@Name({ code: "en-US", content: "Shopify orders cancelled" })
@Description({ code: "en-US", content: "Triggered when an order is cancelled in Shopify." })
@DisplayMessage({ code: "en-US", content: "Shopify orders cancelled on ${httpURL}" })
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: ShopifyOrdersCancelledWebhookPayload): REST_ADAPTER_INPUT<ShopifyOrdersCancelledWebhookPayload>")
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
export class ShopifyOrdersCancelledWebhook extends Rest {}
