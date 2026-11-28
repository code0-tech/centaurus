import "reflect-metadata";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";

// Only when the action has events:
// import { startEventBridge } from "./eventBridge.js";

// Data types — register types before the types that reference them.
// import { __Vendor__Message } from "./data_types/__vendor__Message.js";

// Runtime functions
// import { __Vendor__SendMessageFunction } from "./functions/messaging/__vendor__SendMessage.js";

// Events
// import { __Vendor__MessageCreated } from "./events/__vendor__MessageCreated.js";

// The action holds no credentials of its own: every function and every event
// takes the credential it works with as its first parameter, so one running
// action serves as many __Vendor__ accounts as its flows use.
const action = new Action(
    process.env.ACTION_ID ?? "__vendor__-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "__ICON__",
    "__DESCRIPTION__",
    [{ code: "en-US", content: "__Vendor__" }],
    []
);

// action.registerDataTypeClass(__Vendor__Message);

// action.registerRuntimeFunction(__Vendor__SendMessageFunction);

// action.registerRuntimeEventClass(__Vendor__MessageCreated);

// startEventBridge(action);

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

export { action };
