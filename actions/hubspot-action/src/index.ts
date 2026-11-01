import "reflect-metadata";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";

import { HubSpotContactDataType } from "./data_types/hubspotContact.js";
import { HubSpotDealDataType } from "./data_types/hubspotDeal.js";
import { HubSpotCompanyDataType } from "./data_types/hubspotCompany.js";
import { HubSpotNoteDataType } from "./data_types/hubspotNote.js";
import { HubSpotSearchResultDataType } from "./data_types/hubspotSearchResult.js";
import { HubSpotWebhookEventDataType } from "./data_types/hubspotWebhookEvent.js";

import { HubSpotContactCreatedWebhook } from "./events/hubspotContactCreatedWebhook.js";
import { HubSpotDealCreatedWebhook } from "./events/hubspotDealCreatedWebhook.js";
import { HubSpotDealStageChangedWebhook } from "./events/hubspotDealStageChangedWebhook.js";
import { HubSpotFormSubmittedWebhook } from "./events/hubspotFormSubmittedWebhook.js";

import { HubSpotCreateContactFunction } from "./functions/hubspotCreateContactFunction.js";
import { HubSpotUpdateContactFunction } from "./functions/hubspotUpdateContactFunction.js";
import { HubSpotGetContactByEmailFunction } from "./functions/hubspotGetContactByEmailFunction.js";
import { HubSpotCreateDealFunction } from "./functions/hubspotCreateDealFunction.js";
import { HubSpotUpdateDealFunction } from "./functions/hubspotUpdateDealFunction.js";
import { HubSpotCreateCompanyFunction } from "./functions/hubspotCreateCompanyFunction.js";
import { HubSpotAddNoteFunction } from "./functions/hubspotAddNoteFunction.js";
import { HubSpotAssociateFunction } from "./functions/hubspotAssociateFunction.js";
import { HubSpotSearchObjectsFunction } from "./functions/hubspotSearchObjectsFunction.js";

const action = new Action(
    process.env.ACTION_ID ?? "hubspot-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "simple:hubspot",
    "HubSpot CRM integration: react to contact/deal/company webhooks and create, update, search, associate, and annotate CRM records via the HubSpot CRM v3 API.",
    [{ code: "en-US", content: "HubSpot" }],
    [
        {
            identifier: "access_token",
            type: "TEXT",
            name: [{ code: "en-US", content: "Access token" }],
            description: [{ code: "en-US", content: "Private-app access token (Bearer) used to authenticate with the HubSpot CRM API." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "app_id",
            type: "TEXT",
            defaultValue: "",
            name: [{ code: "en-US", content: "App id" }],
            description: [{ code: "en-US", content: "Optional HubSpot app id, used when managing webhook subscriptions." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "client_secret",
            type: "TEXT",
            defaultValue: "",
            name: [{ code: "en-US", content: "Client secret" }],
            description: [{ code: "en-US", content: "Optional HubSpot app client secret, used to validate the X-HubSpot-Signature on inbound webhooks." }],
            linkedDataTypes: ["TEXT"],
        },
    ]
);

action.registerDataTypeClass(HubSpotContactDataType);
action.registerDataTypeClass(HubSpotDealDataType);
action.registerDataTypeClass(HubSpotCompanyDataType);
action.registerDataTypeClass(HubSpotNoteDataType);
action.registerDataTypeClass(HubSpotSearchResultDataType);
action.registerDataTypeClass(HubSpotWebhookEventDataType);

action.registerEventClass(HubSpotContactCreatedWebhook);
action.registerEventClass(HubSpotDealCreatedWebhook);
action.registerEventClass(HubSpotDealStageChangedWebhook);
action.registerEventClass(HubSpotFormSubmittedWebhook);

action.registerRuntimeFunction(HubSpotCreateContactFunction);
action.registerRuntimeFunction(HubSpotUpdateContactFunction);
action.registerRuntimeFunction(HubSpotGetContactByEmailFunction);
action.registerRuntimeFunction(HubSpotCreateDealFunction);
action.registerRuntimeFunction(HubSpotUpdateDealFunction);
action.registerRuntimeFunction(HubSpotCreateCompanyFunction);
action.registerRuntimeFunction(HubSpotAddNoteFunction);
action.registerRuntimeFunction(HubSpotAssociateFunction);
action.registerRuntimeFunction(HubSpotSearchObjectsFunction);

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
