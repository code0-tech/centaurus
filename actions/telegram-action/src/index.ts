import "reflect-metadata"
import { Action, CodeZeroEvent } from "@code0-tech/hercules"

import { EventBridge, webhookConfigFromEnv } from "./eventBridge.js"

import { TelegramUser } from "./data_types/telegramUser.js"
import { TelegramChatType, TelegramChat } from "./data_types/telegramChat.js"
import { TelegramMessage } from "./data_types/telegramMessage.js"
import { TelegramCallbackQuery } from "./data_types/telegramCallbackQuery.js"
import { TelegramInlineKeyboardButton } from "./data_types/telegramInlineKeyboardButton.js"

import { TelegramSendMessageFunction } from "./functions/telegramSendMessage.js"
import { TelegramSendPhotoFunction } from "./functions/telegramSendPhoto.js"
import { TelegramSendDocumentFunction } from "./functions/telegramSendDocument.js"
import { TelegramEditMessageTextFunction } from "./functions/telegramEditMessageText.js"
import { TelegramDeleteMessageFunction } from "./functions/telegramDeleteMessage.js"
import { TelegramAnswerCallbackQueryFunction } from "./functions/telegramAnswerCallbackQuery.js"
import { TelegramGetChatFunction } from "./functions/telegramGetChat.js"
import { TelegramGetMeFunction } from "./functions/telegramGetMe.js"

import { TelegramMessageReceived } from "./events/telegramMessageReceived.js"
import { TelegramCallbackQueryReceived } from "./events/telegramCallbackQueryReceived.js"

const action = new Action(
    process.env.ACTION_ID ?? "telegram-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "simple:telegram",
    "Telegram bot integration: send and manage messages, answer inline buttons, and react to incoming bot updates.",
    [{ code: "en-US", content: "Telegram" }],
    []
)

action.registerDataTypeClass(TelegramUser)
action.registerDataTypeClass(TelegramChatType)
action.registerDataTypeClass(TelegramChat)
action.registerDataTypeClass(TelegramMessage)
action.registerDataTypeClass(TelegramCallbackQuery)
action.registerDataTypeClass(TelegramInlineKeyboardButton)

action.registerRuntimeFunction(TelegramSendMessageFunction)
action.registerRuntimeFunction(TelegramSendPhotoFunction)
action.registerRuntimeFunction(TelegramSendDocumentFunction)
action.registerRuntimeFunction(TelegramEditMessageTextFunction)
action.registerRuntimeFunction(TelegramDeleteMessageFunction)
action.registerRuntimeFunction(TelegramAnswerCallbackQueryFunction)
action.registerRuntimeFunction(TelegramGetChatFunction)
action.registerRuntimeFunction(TelegramGetMeFunction)

action.registerRuntimeEventClass(TelegramMessageReceived)
action.registerRuntimeEventClass(TelegramCallbackQueryReceived)

new EventBridge(action, webhookConfigFromEnv()).start()

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
