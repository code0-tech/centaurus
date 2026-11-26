import "reflect-metadata"
import { Action, CodeZeroEvent, isExportMode } from "@code0-tech/hercules"

import { SlackAppTokenDataType, SlackBotTokenDataType } from "./data_types/slackTokens.js"
import { SlackEmbedDataType, SlackEmbedFieldDataType } from "./data_types/slackEmbed.js"
import { SlackChannelDataType } from "./data_types/slackChannel.js"
import { SlackFileDataType } from "./data_types/slackFile.js"
import { SlackMessageDataType } from "./data_types/slackMessage.js"
import { SlackReactionDataType } from "./data_types/slackReaction.js"
import { SlackUserDataType } from "./data_types/slackUser.js"
import { SlackAppMentionEventPayload } from "./data_types/slackAppMentionEventPayload.js"
import { SlackChannelCreatedEventPayload } from "./data_types/slackChannelCreatedEventPayload.js"
import { SlackMessagePostedEventPayload } from "./data_types/slackMessagePostedEventPayload.js"
import { SlackReactionAddedEventPayload } from "./data_types/slackReactionAddedEventPayload.js"
import { SlackSlashCommandPayload } from "./data_types/slackSlashCommandPayload.js"

import { AddReactionFunction } from "./functions/addReactionFunction.js"
import { CreateChannelFunction } from "./functions/createChannelFunction.js"
import { DeleteMessageFunction } from "./functions/deleteMessageFunction.js"
import { GetUserByEmailFunction } from "./functions/getUserByEmailFunction.js"
import { InviteToChannelFunction } from "./functions/inviteToChannelFunction.js"
import { PostMessageFunction } from "./functions/postMessageFunction.js"
import { ReplyInThreadFunction } from "./functions/replyInThreadFunction.js"
import { SendDirectMessageFunction } from "./functions/sendDirectMessageFunction.js"
import { SetChannelTopicFunction } from "./functions/setChannelTopicFunction.js"
import { UpdateMessageFunction } from "./functions/updateMessageFunction.js"
import { UploadFileFunction } from "./functions/uploadFileFunction.js"

import { SlackAppMentioned } from "./events/slackAppMentioned.js"
import { SlackChannelCreated } from "./events/slackChannelCreated.js"
import { SlackMessagePosted } from "./events/slackMessagePosted.js"
import { SlackReactionAdded } from "./events/slackReactionAdded.js"
import { SlackSlashCommand } from "./events/slackSlashCommand.js"
import { SlackSocketManager } from "./socketMode.js"

const action = new Action(
    process.env.ACTION_ID ?? "slack-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "tabler:brand-slack",
    "Slack integration: post and update messages, react to Slack events, and drive channel, user and file operations via the Slack Web API.",
    [{ code: "en-US", content: "Slack" }],
    []
)

action.registerDataTypeClass(SlackBotTokenDataType)
action.registerDataTypeClass(SlackAppTokenDataType)
action.registerDataTypeClass(SlackEmbedFieldDataType)
action.registerDataTypeClass(SlackEmbedDataType)
action.registerDataTypeClass(SlackChannelDataType)
action.registerDataTypeClass(SlackFileDataType)
action.registerDataTypeClass(SlackMessageDataType)
action.registerDataTypeClass(SlackReactionDataType)
action.registerDataTypeClass(SlackUserDataType)
action.registerDataTypeClass(SlackAppMentionEventPayload)
action.registerDataTypeClass(SlackChannelCreatedEventPayload)
action.registerDataTypeClass(SlackMessagePostedEventPayload)
action.registerDataTypeClass(SlackReactionAddedEventPayload)
action.registerDataTypeClass(SlackSlashCommandPayload)

action.registerRuntimeFunction(PostMessageFunction)
action.registerRuntimeFunction(ReplyInThreadFunction)
action.registerRuntimeFunction(UpdateMessageFunction)
action.registerRuntimeFunction(DeleteMessageFunction)
action.registerRuntimeFunction(AddReactionFunction)
action.registerRuntimeFunction(SendDirectMessageFunction)
action.registerRuntimeFunction(UploadFileFunction)
action.registerRuntimeFunction(CreateChannelFunction)
action.registerRuntimeFunction(InviteToChannelFunction)
action.registerRuntimeFunction(GetUserByEmailFunction)
action.registerRuntimeFunction(SetChannelTopicFunction)

action.registerRuntimeEventClass(SlackMessagePosted)
action.registerRuntimeEventClass(SlackAppMentioned)
action.registerRuntimeEventClass(SlackReactionAdded)
action.registerRuntimeEventClass(SlackChannelCreated)
action.registerRuntimeEventClass(SlackSlashCommand)

// Slack events arrive over Socket Mode, one connection per app token the
// trigger flows use; the manager follows the flows Aquila sends.
const socketManager = new SlackSocketManager(action)
if (!isExportMode()) {
    socketManager.start()
}

// Close the Socket Mode connections on shutdown, so Slack stops routing
// deliveries to this instance right away instead of waiting for a timeout.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
        socketManager
            .stop()
            .catch((error: Error) => console.error("Could not close the Slack connections:", error.message))
            .finally(() => process.exit(0))
    })
}

action.on(CodeZeroEvent.connected, () => {
    console.log("Connected to aquila")
})

action.on(CodeZeroEvent.error, (error: Error) => {
    console.error("Stream error:", error.message)
    console.log("Attempting to reconnect in 5s...")
    setTimeout(() => {
        action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((err: Error) => {
            action.emit(CodeZeroEvent.error, err)
        })
    }, 5000)
})

action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((err: Error) => {
    action.emit(CodeZeroEvent.error, err)
})

export { action }
