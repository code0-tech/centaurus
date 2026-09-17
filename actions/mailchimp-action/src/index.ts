import "reflect-metadata";
import {Action, CodeZeroEvent} from "@code0-tech/hercules";

import {MailchimpMemberDataType} from "./data_types/mailchimpMember.ts";
import {MailchimpMemberListDataType} from "./data_types/mailchimpMemberList.ts";
import {MailchimpAudienceDataType} from "./data_types/mailchimpAudience.ts";
import {MailchimpCampaignDataType} from "./data_types/mailchimpCampaign.ts";
import {MailchimpTagDataType} from "./data_types/mailchimpTag.ts";
import {MailchimpMergeFieldsDataType} from "./data_types/mailchimpMergeFields.ts";
import {MailchimpSubscribeWebhookPayload} from "./data_types/mailchimpSubscribeWebhookPayload.ts";
import {MailchimpUnsubscribeWebhookPayload} from "./data_types/mailchimpUnsubscribeWebhookPayload.ts";
import {MailchimpProfileWebhookPayload} from "./data_types/mailchimpProfileWebhookPayload.ts";
import {MailchimpCleanedWebhookPayload} from "./data_types/mailchimpCleanedWebhookPayload.ts";
import {MailchimpCampaignWebhookPayload} from "./data_types/mailchimpCampaignWebhookPayload.ts";

import {AddOrUpdateMemberFunction} from "./functions/addOrUpdateMemberFunction.ts";
import {GetMemberFunction} from "./functions/getMemberFunction.ts";
import {UpdateMemberTagsFunction} from "./functions/updateMemberTagsFunction.ts";
import {ArchiveMemberFunction} from "./functions/archiveMemberFunction.ts";
import {DeleteMemberPermanentFunction} from "./functions/deleteMemberPermanentFunction.ts";
import {ListMembersFunction} from "./functions/listMembersFunction.ts";
import {CreateCampaignFunction} from "./functions/createCampaignFunction.ts";
import {SendCampaignFunction} from "./functions/sendCampaignFunction.ts";
import {GetAudienceFunction} from "./functions/getAudienceFunction.ts";
import {CreateMergeFieldsFunction} from "./functions/utils/createMergeFieldsFunction.ts";

import {MailchimpSubscribed} from "./events/mailchimpSubscribed.ts";
import {MailchimpUnsubscribed} from "./events/mailchimpUnsubscribed.ts";
import {MailchimpProfileUpdated} from "./events/mailchimpProfileUpdated.ts";
import {MailchimpEmailCleaned} from "./events/mailchimpEmailCleaned.ts";
import {MailchimpCampaignSent} from "./events/mailchimpCampaignSent.ts";

const action = new Action(
    process.env.ACTION_ID ?? "mailchimp-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "simple:mailchimp",
    "Mailchimp integration: manage audiences, subscribers and campaigns, and react to Mailchimp audience webhook events.",
    [{code: "en-US", content: "Mailchimp"}],
    [
        {
            identifier: "api_key",
            type: "TEXT",
            name: [{code: "en-US", content: "API key"}],
            description: [
                {
                    code: "en-US",
                    content: "Your Mailchimp API key (ends in -usX). The usX suffix selects the API server/datacenter.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "server_prefix",
            type: "TEXT",
            defaultValue: "",
            name: [{code: "en-US", content: "Server prefix"}],
            description: [
                {
                    code: "en-US",
                    content:
                        "Optional datacenter prefix (e.g. us21) for the Mailchimp API host. Leave empty to derive it from the API key's suffix.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
    ]
);

action.registerDataTypeClass(MailchimpMemberDataType);
action.registerDataTypeClass(MailchimpMemberListDataType);
action.registerDataTypeClass(MailchimpAudienceDataType);
action.registerDataTypeClass(MailchimpCampaignDataType);
action.registerDataTypeClass(MailchimpTagDataType);
action.registerDataTypeClass(MailchimpMergeFieldsDataType);
action.registerDataTypeClass(MailchimpSubscribeWebhookPayload);
action.registerDataTypeClass(MailchimpUnsubscribeWebhookPayload);
action.registerDataTypeClass(MailchimpProfileWebhookPayload);
action.registerDataTypeClass(MailchimpCleanedWebhookPayload);
action.registerDataTypeClass(MailchimpCampaignWebhookPayload);

action.registerRuntimeFunction(AddOrUpdateMemberFunction);
action.registerRuntimeFunction(GetMemberFunction);
action.registerRuntimeFunction(UpdateMemberTagsFunction);
action.registerRuntimeFunction(ArchiveMemberFunction);
action.registerRuntimeFunction(DeleteMemberPermanentFunction);
action.registerRuntimeFunction(ListMembersFunction);
action.registerRuntimeFunction(CreateCampaignFunction);
action.registerRuntimeFunction(SendCampaignFunction);
action.registerRuntimeFunction(GetAudienceFunction);
action.registerRuntimeFunction(CreateMergeFieldsFunction);

action.registerEventClass(MailchimpSubscribed);
action.registerEventClass(MailchimpUnsubscribed);
action.registerEventClass(MailchimpProfileUpdated);
action.registerEventClass(MailchimpEmailCleaned);
action.registerEventClass(MailchimpCampaignSent);

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
