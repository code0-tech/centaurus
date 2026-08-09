import "reflect-metadata";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";

import {
    DiscordEmbedAuthorDataType,
    DiscordEmbedDataType,
    DiscordEmbedFooterDataType,
} from "./data_types/discordEmbed.js";
import {
    DiscordWebhookResponseDataType,
} from "./data_types/discordWebhook.js";

import { CreateDiscordEmbedAuthorFunction } from "./functions/createDiscordEmbedAuthorFunction.js";
import { CreateDiscordEmbedFooterFunction } from "./functions/createDiscordEmbedFooterFunction.js";
import { CreateDiscordEmbedFunction } from "./functions/createDiscordEmbedFunction.js";
import { CreateDiscordWebhookUrlFunction } from "./functions/createDiscordWebhookUrlFunction.js";
import { SendDiscordWebhookFunction } from "./functions/sendDiscordWebhookFunction.js";

const action = new Action(
    process.env.ACTION_ID ?? "discord-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "192.168.2.105:8081",
    "code0-tech",
    "simple:discord",
    "Discord integration: create webhook URLs, construct rich embeds, and send webhooks.",
    [{ code: "en-US", content: "Discord" }],
    [
        {
            identifier: "webhook_url",
            type: "TEXT",
            defaultValue: "",
            name: [{ code: "en-US", content: "Webhook URL" }],
            description: [{ code: "en-US", content: "Default Discord Webhook URL to use as fallback." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "username",
            type: "TEXT",
            defaultValue: "",
            name: [{ code: "en-US", content: "Username" }],
            description: [{ code: "en-US", content: "Default username for the Discord webhook poster." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "avatar_url",
            type: "TEXT",
            defaultValue: "",
            name: [{ code: "en-US", content: "Avatar URL" }],
            description: [{ code: "en-US", content: "Default avatar image URL for the Discord webhook poster." }],
            linkedDataTypes: ["TEXT"],
        },
    ]
);

action.registerDataTypeClass(DiscordEmbedFooterDataType);
action.registerDataTypeClass(DiscordEmbedAuthorDataType);
action.registerDataTypeClass(DiscordEmbedDataType);
action.registerDataTypeClass(DiscordWebhookResponseDataType);

action.registerRuntimeFunction(CreateDiscordWebhookUrlFunction);
action.registerRuntimeFunction(CreateDiscordEmbedFooterFunction);
action.registerRuntimeFunction(CreateDiscordEmbedAuthorFunction);
action.registerRuntimeFunction(CreateDiscordEmbedFunction);
action.registerRuntimeFunction(SendDiscordWebhookFunction);

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
