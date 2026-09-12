import "reflect-metadata";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";

import { SlackBlockDataType } from "./data_types/slackBlock.js";
import { SlackChannelDataType } from "./data_types/slackChannel.js";
import { SlackFileDataType } from "./data_types/slackFile.js";
import { SlackMessageDataType } from "./data_types/slackMessage.js";
import { SlackReactionDataType } from "./data_types/slackReaction.js";
import { SlackUserDataType } from "./data_types/slackUser.js";
import { SlackAppMentionEventPayload } from "./data_types/slackAppMentionEventPayload.js";
import { SlackChannelCreatedEventPayload } from "./data_types/slackChannelCreatedEventPayload.js";
import { SlackMessagePostedEventPayload } from "./data_types/slackMessagePostedEventPayload.js";
import { SlackReactionAddedEventPayload } from "./data_types/slackReactionAddedEventPayload.js";
import { SlackSlashCommandPayload } from "./data_types/slackSlashCommandPayload.js";

import { AddReactionFunction } from "./functions/addReactionFunction.js";
import { CreateChannelFunction } from "./functions/createChannelFunction.js";
import { DeleteMessageFunction } from "./functions/deleteMessageFunction.js";
import { GetUserByEmailFunction } from "./functions/getUserByEmailFunction.js";
import { InviteToChannelFunction } from "./functions/inviteToChannelFunction.js";
import { PostMessageFunction } from "./functions/postMessageFunction.js";
import { ReplyInThreadFunction } from "./functions/replyInThreadFunction.js";
import { SendDirectMessageFunction } from "./functions/sendDirectMessageFunction.js";
import { SetChannelTopicFunction } from "./functions/setChannelTopicFunction.js";
import { UpdateMessageFunction } from "./functions/updateMessageFunction.js";
import { UploadFileFunction } from "./functions/uploadFileFunction.js";
import { VerifyRequestSignatureFunction } from "./functions/verifyRequestSignatureFunction.js";

import { CreateBlockFunction } from "./functions/utils/createBlockFunction.js";
import { CreateTextSectionFunction } from "./functions/utils/createTextSectionFunction.js";

import { SlackAppMentioned } from "./events/slackAppMentioned.js";
import { SlackChannelCreated } from "./events/slackChannelCreated.js";
import { SlackMessagePosted } from "./events/slackMessagePosted.js";
import { SlackReactionAdded } from "./events/slackReactionAdded.js";
import { SlackSlashCommand } from "./events/slackSlashCommand.js";

const action = new Action(
    process.env.ACTION_ID ?? "slack-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "simple:slack",
    "Slack integration: post and update messages, react to Slack events, and drive channel, user and file operations via the Slack Web API.",
    [{ code: "en-US", content: "Slack" }],
    [
        {
            identifier: "bot_token",
            type: "TEXT",
            defaultValue: process.env.SLACK_BOT_TOKEN ?? "",
            name: [{ code: "en-US", content: "Bot token" }],
            description: [
                {
                    code: "en-US",
                    content:
                        "The bot user OAuth token (xoxb-...) used as the Bearer credential for the Slack Web API. Find it under OAuth & Permissions in your Slack app.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "signing_secret",
            type: "TEXT",
            defaultValue: process.env.SLACK_SIGNING_SECRET ?? "",
            name: [{ code: "en-US", content: "Signing secret" }],
            description: [
                {
                    code: "en-US",
                    content:
                        "The Slack signing secret used by slackVerifyRequestSignature to validate the X-Slack-Signature and X-Slack-Request-Timestamp headers of inbound requests. Find it under Basic Information in your Slack app.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "app_token",
            type: "TEXT",
            defaultValue: process.env.SLACK_APP_TOKEN ?? "",
            optional: true,
            name: [{ code: "en-US", content: "App token" }],
            description: [
                {
                    code: "en-US",
                    content:
                        "An optional app-level token (xapp-...), only needed if you run the Slack app in Socket Mode instead of exposing the webhook events as public HTTP endpoints.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
    ]
);

action.registerDataTypeClass(SlackBlockDataType);
action.registerDataTypeClass(SlackChannelDataType);
action.registerDataTypeClass(SlackFileDataType);
action.registerDataTypeClass(SlackMessageDataType);
action.registerDataTypeClass(SlackReactionDataType);
action.registerDataTypeClass(SlackUserDataType);
action.registerDataTypeClass(SlackAppMentionEventPayload);
action.registerDataTypeClass(SlackChannelCreatedEventPayload);
action.registerDataTypeClass(SlackMessagePostedEventPayload);
action.registerDataTypeClass(SlackReactionAddedEventPayload);
action.registerDataTypeClass(SlackSlashCommandPayload);

action.registerRuntimeFunction(PostMessageFunction);
action.registerRuntimeFunction(ReplyInThreadFunction);
action.registerRuntimeFunction(UpdateMessageFunction);
action.registerRuntimeFunction(DeleteMessageFunction);
action.registerRuntimeFunction(AddReactionFunction);
action.registerRuntimeFunction(SendDirectMessageFunction);
action.registerRuntimeFunction(UploadFileFunction);
action.registerRuntimeFunction(CreateChannelFunction);
action.registerRuntimeFunction(InviteToChannelFunction);
action.registerRuntimeFunction(GetUserByEmailFunction);
action.registerRuntimeFunction(SetChannelTopicFunction);
action.registerRuntimeFunction(VerifyRequestSignatureFunction);

action.registerRuntimeFunction(CreateBlockFunction);
action.registerRuntimeFunction(CreateTextSectionFunction);

action.registerEventClass(SlackMessagePosted);
action.registerEventClass(SlackAppMentioned);
action.registerEventClass(SlackReactionAdded);
action.registerEventClass(SlackChannelCreated);
action.registerEventClass(SlackSlashCommand);

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
