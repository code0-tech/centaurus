import "reflect-metadata";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";

import { HubSpotContactDataType } from "./data_types/hubspotContact.js";
import { HubSpotDealDataType } from "./data_types/hubspotDeal.js";
import { HubSpotCompanyDataType } from "./data_types/hubspotCompany.js";
import { HubSpotNoteDataType } from "./data_types/hubspotNote.js";
import { HubSpotSearchResultDataType } from "./data_types/hubspotSearchResult.js";
import { HubSpotSearchFilterDataType } from "./data_types/hubspotSearchFilter.js";
import { HubSpotAssociationDataType } from "./data_types/hubspotAssociation.js";
import { HubSpotPropertyMapDataType } from "./data_types/hubspotPropertyMap.js";
import { HubSpotWebhookEventDataType } from "./data_types/hubspotWebhookEvent.js";
import { HubSpotContactCreatedWebhookPayloadDataType } from "./data_types/hubspotContactCreatedWebhookPayload.js";
import { HubSpotContactPropertyChangedWebhookPayloadDataType } from "./data_types/hubspotContactPropertyChangedWebhookPayload.js";
import { HubSpotDealCreatedWebhookPayloadDataType } from "./data_types/hubspotDealCreatedWebhookPayload.js";
import { HubSpotDealStageChangedWebhookPayloadDataType } from "./data_types/hubspotDealStageChangedWebhookPayload.js";
import { HubSpotCompanyCreatedWebhookPayloadDataType } from "./data_types/hubspotCompanyCreatedWebhookPayload.js";
import { HubSpotFormSubmittedWebhookPayloadDataType } from "./data_types/hubspotFormSubmittedWebhookPayload.js";

import { HubSpotContactCreatedWebhook } from "./events/hubspotContactCreatedWebhook.js";
import { HubSpotContactPropertyChangedWebhook } from "./events/hubspotContactPropertyChangedWebhook.js";
import { HubSpotDealCreatedWebhook } from "./events/hubspotDealCreatedWebhook.js";
import { HubSpotDealStageChangedWebhook } from "./events/hubspotDealStageChangedWebhook.js";
import { HubSpotCompanyCreatedWebhook } from "./events/hubspotCompanyCreatedWebhook.js";
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
import { HubSpotVerifyWebhookSignatureFunction } from "./functions/hubspotVerifyWebhookSignatureFunction.js";
import { HubSpotCreatePropertyMapFunction } from "./functions/utils/hubspotCreatePropertyMapFunction.js";
import { HubSpotCreateSearchFilterFunction } from "./functions/utils/hubspotCreateSearchFilterFunction.js";
import { HubSpotCreateAssociationTypeFunction } from "./functions/utils/hubspotCreateAssociationTypeFunction.js";

const action = new Action(
    process.env.ACTION_ID ?? "hubspot-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "simple:hubspot",
    "HubSpot CRM integration: react to contact/deal/company/form webhooks and create, update, search, associate, and annotate CRM records via the HubSpot CRM v3 API.",
    [{ code: "en-US", content: "HubSpot" }],
    []
);

// Data types first: events and functions reference them in their signatures.
action.registerDataTypeClass(HubSpotPropertyMapDataType);
action.registerDataTypeClass(HubSpotContactDataType);
action.registerDataTypeClass(HubSpotDealDataType);
action.registerDataTypeClass(HubSpotCompanyDataType);
action.registerDataTypeClass(HubSpotNoteDataType);
action.registerDataTypeClass(HubSpotSearchResultDataType);
action.registerDataTypeClass(HubSpotSearchFilterDataType);
action.registerDataTypeClass(HubSpotAssociationDataType);
action.registerDataTypeClass(HubSpotWebhookEventDataType);
action.registerDataTypeClass(HubSpotContactCreatedWebhookPayloadDataType);
action.registerDataTypeClass(HubSpotContactPropertyChangedWebhookPayloadDataType);
action.registerDataTypeClass(HubSpotDealCreatedWebhookPayloadDataType);
action.registerDataTypeClass(HubSpotDealStageChangedWebhookPayloadDataType);
action.registerDataTypeClass(HubSpotCompanyCreatedWebhookPayloadDataType);
action.registerDataTypeClass(HubSpotFormSubmittedWebhookPayloadDataType);

action.registerEventClass(HubSpotContactCreatedWebhook);
action.registerEventClass(HubSpotContactPropertyChangedWebhook);
action.registerEventClass(HubSpotDealCreatedWebhook);
action.registerEventClass(HubSpotDealStageChangedWebhook);
action.registerEventClass(HubSpotCompanyCreatedWebhook);
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
action.registerRuntimeFunction(HubSpotVerifyWebhookSignatureFunction);
action.registerRuntimeFunction(HubSpotCreatePropertyMapFunction);
action.registerRuntimeFunction(HubSpotCreateSearchFilterFunction);
action.registerRuntimeFunction(HubSpotCreateAssociationTypeFunction);

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
