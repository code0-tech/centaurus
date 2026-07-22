import "reflect-metadata";
import {Action, CodeZeroEvent} from "@code0-tech/hercules";

import {StripeCustomerDataType} from "./data_types/stripeCustomer.ts";
import {StripePaymentIntentDataType} from "./data_types/stripePaymentIntent.ts";
import {StripeRefundDataType} from "./data_types/stripeRefund.ts";
import {StripePaymentIntentSucceededWebhookPayload} from "./data_types/stripePaymentIntentSucceededWebhookPayload.ts";
import {StripeChargeRefundedWebhookPayload} from "./data_types/stripeChargeRefundedWebhookPayload.ts";

import {CreateCustomerFunction} from "./functions/createCustomerFunction.ts";
import {CreatePaymentIntentFunction} from "./functions/createPaymentIntentFunction.ts";
import {RetrievePaymentIntentFunction} from "./functions/retrievePaymentIntentFunction.ts";
import {CreateRefundFunction} from "./functions/createRefundFunction.ts";

import {StripePaymentIntentSucceededWebhook} from "./events/stripePaymentIntentSucceededWebhook.ts";
import {StripeChargeRefundedWebhook} from "./events/stripeChargeRefundedWebhook.ts";

const action = new Action(
    process.env.ACTION_ID ?? "stripe-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "simple:stripe",
    "Stripe payments integration: manage customers, payment intents and refunds, and react to Stripe webhook events.",
    [{code: "en-US", content: "Stripe Action"}],
    [
        {
            identifier: "secret_key",
            type: "TEXT",
            name: [{code: "en-US", content: "Secret key"}],
            description: [
                {
                    code: "en-US",
                    content:
                        "Your Stripe secret API key (starts with sk_). Use a test key (sk_test_...) while testing.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "api_version",
            type: "TEXT",
            defaultValue: "",
            name: [{code: "en-US", content: "API version"}],
            description: [
                {
                    code: "en-US",
                    content:
                        "Optional Stripe API version to pin (e.g. 2024-06-20). Leave empty to use your account's default version.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "webhook_secret",
            type: "TEXT",
            defaultValue: "",
            name: [{code: "en-US", content: "Webhook signing secret"}],
            description: [
                {
                    code: "en-US",
                    content:
                        "Optional Stripe webhook signing secret (starts with whsec_) used to verify incoming webhook events.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
    ]
);

action.registerDataTypeClass(StripeCustomerDataType);
action.registerDataTypeClass(StripePaymentIntentDataType);
action.registerDataTypeClass(StripeRefundDataType);
action.registerDataTypeClass(StripePaymentIntentSucceededWebhookPayload);
action.registerDataTypeClass(StripeChargeRefundedWebhookPayload);

action.registerRuntimeFunction(CreateCustomerFunction);
action.registerRuntimeFunction(CreatePaymentIntentFunction);
action.registerRuntimeFunction(RetrievePaymentIntentFunction);
action.registerRuntimeFunction(CreateRefundFunction);

action.registerEventClass(StripePaymentIntentSucceededWebhook);
action.registerEventClass(StripeChargeRefundedWebhook);

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
