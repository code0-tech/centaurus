import {Action, CodeZeroEvent} from "@code0-tech/hercules";
import {ShopwareOrderPlacedWebhookPayload} from "./data_types/shopwareOrderPlacedWebhookPayload.ts";
import {ShopwareOrderCancelledWebhookPayload} from "./data_types/shopwareOrderCancelledWebhookPayload.ts";
import {ShopwareOrderPaidWebhookPayload} from "./data_types/shopwareOrderPaidWebhookPayload.ts";
import {ShopwareOrderPlacedWebhook} from "./events/shopwareOrderPlacedWebhook.ts";
import {ShopwareOrderCancelledWebhook} from "./events/shopwareOrderCancelledWebhook.ts";
import {ShopwareOrderPaidWebhook} from "./events/shopwareOrderPaidWebhook.ts";

const action = new Action(
    process.env.ACTION_ID ?? "shopware-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "simple:shopware",
    "",
    [{code: "en-US", content: "Shopware"}],
    []
)

action.registerDataTypeClass(ShopwareOrderPlacedWebhookPayload)
action.registerDataTypeClass(ShopwareOrderCancelledWebhookPayload)
action.registerDataTypeClass(ShopwareOrderPaidWebhookPayload)
action.registerEventClass(ShopwareOrderPlacedWebhook)
action.registerEventClass(ShopwareOrderCancelledWebhook)
action.registerEventClass(ShopwareOrderPaidWebhook)

action.on(CodeZeroEvent.connected, () => {
    console.log("Connected to aquila");
});

action.on(CodeZeroEvent.error, (error: Error) => {
    console.error("Stream error:", error.message);
    console.log("Attempting to reconnect in 5s...");
    setTimeout(() => {
        action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((err: unknown) => {
            console.error("Reconnect failed:", err);
        });
    }, 5000);
});

action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((err: unknown) => {
    console.error("Failed to connect:", err);
    process.exit(1);
});

action.on(CodeZeroEvent.moduleUpdated, (message: any) => {
    console.dir(message, {depth: null});
    console.dir(action.configs.values(), {depth: null})
})

export {action};