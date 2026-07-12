import {Action, CodeZeroEvent} from "@code0-tech/hercules";
import {ShopwareOrderPlacedWebhookPayload} from "./data_types/shopwareOrderPlacedWebhookPayload.ts";
import {ShopwareOrderCancelledWebhookPayload} from "./data_types/shopwareOrderCancelledWebhookPayload.ts";
import {ShopwareOrderPaidWebhookPayload} from "./data_types/shopwareOrderPaidWebhookPayload.ts";
import {ShopwareOrder} from "./data_types/shopwareOrder.ts";
import {ShopwareOrderDelivery} from "./data_types/shopwareOrderDelivery.ts";
import {ShopwareOrderDeliveryPosition} from "./data_types/shopwareOrderDeliveryPosition.ts";
import {ShopwareOrderLineItem} from "./data_types/shopwareOrderLineItem.ts";
import {ShopwareOrderLineItemDownload} from "./data_types/shopwareOrderLineItemDownload.ts";
import {ShopwareOrderTransaction} from "./data_types/shopwareOrderTransaction.ts";
import {ShopwareOrderTransactionCapture} from "./data_types/shopwareOrderTransactionCapture.ts";
import {ShopwareOrderTransactionCaptureRefund} from "./data_types/shopwareOrderTransactionCaptureRefund.ts";
import {ShopwareOrderTransactionCaptureRefundPosition} from "./data_types/shopwareOrderTransactionCaptureRefundPosition.ts";
import {ShopwareOrderCustomer} from "./data_types/shopwareOrderCustomer.ts";
import {ShopwareOrderAddress} from "./data_types/shopwareOrderAddress.ts";
import {ShopwareStateMachineState} from "./data_types/shopwareStateMachineState.ts";
import {ShopwareSalutation} from "./data_types/shopwareSalutation.ts";
import {ShopwareCurrency} from "./data_types/shopwareCurrency.ts";
import {ShopwareCountry} from "./data_types/shopwareCountry.ts";
import {ShopwareCountryState} from "./data_types/shopwareCountryState.ts";
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

action.registerDataTypeClass(ShopwareOrder)
action.registerDataTypeClass(ShopwareOrderDelivery)
action.registerDataTypeClass(ShopwareOrderDeliveryPosition)
action.registerDataTypeClass(ShopwareOrderLineItem)
action.registerDataTypeClass(ShopwareOrderLineItemDownload)
action.registerDataTypeClass(ShopwareOrderTransaction)
action.registerDataTypeClass(ShopwareOrderTransactionCapture)
action.registerDataTypeClass(ShopwareOrderTransactionCaptureRefund)
action.registerDataTypeClass(ShopwareOrderTransactionCaptureRefundPosition)
action.registerDataTypeClass(ShopwareOrderCustomer)
action.registerDataTypeClass(ShopwareOrderAddress)
action.registerDataTypeClass(ShopwareStateMachineState)
action.registerDataTypeClass(ShopwareSalutation)
action.registerDataTypeClass(ShopwareCurrency)
action.registerDataTypeClass(ShopwareCountry)
action.registerDataTypeClass(ShopwareCountryState)
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