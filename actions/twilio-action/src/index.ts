import "reflect-metadata";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";

import { TwilioMessageDataType } from "./data_types/twilioMessage.js";
import { SendMessageFunction } from "./functions/sendMessageFunction.js";

const action = new Action(
    process.env.ACTION_ID ?? "twilio-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "simple:twilio",
    "Twilio integration: send SMS, MMS, and channel messages (e.g. WhatsApp) via the Twilio Messages API.",
    [{ code: "en-US", content: "Twilio Action" }],
    [
        {
            identifier: "account_sid",
            type: "TEXT",
            name: [{ code: "en-US", content: "Account SID" }],
            description: [{ code: "en-US", content: "The Twilio Account SID used to authenticate with the Twilio API." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "auth_token",
            type: "TEXT",
            name: [{ code: "en-US", content: "Auth token" }],
            description: [{ code: "en-US", content: "The Twilio Auth Token used to authenticate with the Twilio API." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "from_number",
            type: "TEXT",
            defaultValue: "",
            name: [{ code: "en-US", content: "Default sender" }],
            description: [
                {
                    code: "en-US",
                    content:
                        "The default sender (phone number, short code, or channel address) used when a message does not specify a From value.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
    ]
);

action.registerDataTypeClass(TwilioMessageDataType);

action.registerRuntimeFunction(SendMessageFunction);

action.on(CodeZeroEvent.connected, () => {
    console.log("Connected to aquila");
});

action.on(CodeZeroEvent.error, (error: Error) => {
    console.error("Stream error:", error.message);
    console.log("Attempting to reconnect in 5s...");
    setTimeout(() => {
        action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((err: Error) => {
            action.emit(CodeZeroEvent.error, err);
        });
    }, 5000);
});

action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((err: Error) => {
    action.emit(CodeZeroEvent.error, err);
});

action.on(CodeZeroEvent.moduleUpdated, (message: any) => {
    console.dir(message, { depth: null });
    console.dir(action.configs.values(), { depth: null });
});

export { action };
