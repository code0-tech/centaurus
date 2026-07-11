import {Action, CodeZeroEvent} from "@code0-tech/hercules";
import {ShopifyOrdersCreateWebhookPayload} from "./data_types/shopifyOrdersCreateWebhookPayload.ts";
import {ShopifyOrdersPaidWebhookPayload} from "./data_types/shopifyOrdersPaidWebhookPayload.ts";
import {ShopifyOrdersCancelledWebhookPayload} from "./data_types/shopifyOrdersCancelledWebhookPayload.ts";
import {ShopifyOrdersUpdatedWebhookPayload} from "./data_types/shopifyOrdersUpdatedWebhookPayload.ts";
import {ShopifyOrdersFulfilledWebhookPayload} from "./data_types/shopifyOrdersFulfilledWebhookPayload.ts";
import {ShopifyFulfillmentsCreateWebhookPayload} from "./data_types/shopifyFulfillmentsCreateWebhookPayload.ts";
import {ShopifyFulfillmentsUpdateWebhookPayload} from "./data_types/shopifyFulfillmentsUpdateWebhookPayload.ts";
import {ShopifyRefundsCreateWebhookPayload} from "./data_types/shopifyRefundsCreateWebhookPayload.ts";
import {ShopifyOrdersCreateWebhook} from "./events/shopifyOrdersCreateWebhook.ts";
import {ShopifyOrdersPaidWebhook} from "./events/shopifyOrdersPaidWebhook.ts";
import {ShopifyOrdersCancelledWebhook} from "./events/shopifyOrdersCancelledWebhook.ts";
import {ShopifyOrdersUpdatedWebhook} from "./events/shopifyOrdersUpdatedWebhook.ts";
import {ShopifyOrdersFulfilledWebhook} from "./events/shopifyOrdersFulfilledWebhook.ts";
import {ShopifyFulfillmentsCreateWebhook} from "./events/shopifyFulfillmentsCreateWebhook.ts";
import {ShopifyFulfillmentsUpdateWebhook} from "./events/shopifyFulfillmentsUpdateWebhook.ts";
import {ShopifyRefundsCreateWebhook} from "./events/shopifyRefundsCreateWebhook.ts";

const action = new Action(
    process.env.ACTION_ID ?? "shopify-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "simple:shopify",
    "",
    [{code: "en-US", content: "Shopify"}],
    []
)

action.registerDataTypeClass(ShopifyOrdersCreateWebhookPayload)
action.registerDataTypeClass(ShopifyOrdersPaidWebhookPayload)
action.registerDataTypeClass(ShopifyOrdersCancelledWebhookPayload)
action.registerDataTypeClass(ShopifyOrdersUpdatedWebhookPayload)
action.registerDataTypeClass(ShopifyOrdersFulfilledWebhookPayload)
action.registerDataTypeClass(ShopifyFulfillmentsCreateWebhookPayload)
action.registerDataTypeClass(ShopifyFulfillmentsUpdateWebhookPayload)
action.registerDataTypeClass(ShopifyRefundsCreateWebhookPayload)
action.registerEventClass(ShopifyOrdersCreateWebhook)
action.registerEventClass(ShopifyOrdersPaidWebhook)
action.registerEventClass(ShopifyOrdersCancelledWebhook)
action.registerEventClass(ShopifyOrdersUpdatedWebhook)
action.registerEventClass(ShopifyOrdersFulfilledWebhook)
action.registerEventClass(ShopifyFulfillmentsCreateWebhook)
action.registerEventClass(ShopifyFulfillmentsUpdateWebhook)
action.registerEventClass(ShopifyRefundsCreateWebhook)

action.on(CodeZeroEvent.connected, () => {
    console.log("Connected to aquila");
});

action.on(CodeZeroEvent.error, (error: Error) => {
    console.error("Stream error:", error.message);
    console.log("Attempting to reconnect in 5s...");
    setTimeout(() => {
        action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((err: Error) => {
            action.emit(CodeZeroEvent.error, err);
        })
    }, 5000);
});

action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((err: Error) => {
    action.emit(CodeZeroEvent.error, err);
});

action.on(CodeZeroEvent.moduleUpdated, (message: any) => {
    console.dir(message, {depth: null});
    console.dir(action.configs.values(), {depth: null})
})

export {action};