import {Action, CodeZeroEvent} from "@code0-tech/hercules";
import {WooCommerceOrderCreatedWebhookPayload} from "./data_types/wooCommerceOrderCreatedWebhookPayload.ts";
import {WooCommerceOrderUpdatedWebhookPayload} from "./data_types/wooCommerceOrderUpdatedWebhookPayload.ts";
import {WooCommerceOrderCreatedWebhook} from "./events/wooCommerceOrderCreatedWebhook.ts";
import {WooCommerceOrderUpdatedWebhook} from "./events/wooCommerceOrderUpdatedWebhook.ts";

const action = new Action(
    process.env.ACTION_ID ?? "woocommerce-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "simple:woo",
    "",
    [{code: "en-US", content: "Woocommerce"}],
    []
)

action.registerDataTypeClass(WooCommerceOrderCreatedWebhookPayload)
action.registerDataTypeClass(WooCommerceOrderUpdatedWebhookPayload)
action.registerEventClass(WooCommerceOrderCreatedWebhook)
action.registerEventClass(WooCommerceOrderUpdatedWebhook)

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