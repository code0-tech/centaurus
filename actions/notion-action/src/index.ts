import "reflect-metadata"
import { Action, CodeZeroEvent, isExportMode } from "@code0-tech/hercules"
import { registerNotionSupportingDataTypes } from "./data_types/generatedSupportingDataTypes.js"
import { NotionRichTextDataType } from "./data_types/notionRichText.js"
import { NotionPropertyValueDataType } from "./data_types/notionPropertyValue.js"
import { NotionUserDataType } from "./data_types/notionUser.js"
import { NotionPageDataType } from "./data_types/notionPage.js"
import { NotionDatabaseDataType } from "./data_types/notionDatabase.js"
import { NotionQueryResultDataType } from "./data_types/notionQueryResult.js"
import { NotionSearchResultDataType } from "./data_types/notionSearchResult.js"
import { NotionFilterDataType } from "./data_types/notionFilter.js"
import { NotionSearchFilterDataType } from "./data_types/notionSearchFilter.js"
import { NotionCreatePageFunction } from "./functions/notionCreatePageFunction.js"
import { NotionUpdatePageFunction } from "./functions/notionUpdatePageFunction.js"
import { NotionGetPageFunction } from "./functions/notionGetPageFunction.js"
import { NotionArchivePageFunction } from "./functions/notionArchivePageFunction.js"
import { NotionQueryDatabaseFunction } from "./functions/notionQueryDatabaseFunction.js"
import { NotionSearchFunction } from "./functions/notionSearchFunction.js"
import { NotionDatabaseItemCreated } from "./events/notionDatabaseItemCreated.js"
import { NotionDatabaseItemUpdated } from "./events/notionDatabaseItemUpdated.js"
import { NotionPagePropertyChanged } from "./events/notionPagePropertyChanged.js"
import { NotionPoller, pollIntervalFromEnv } from "./polling.js"

export const action = new Action(
    process.env.HERCULES_ACTION_ID ?? "notion-action",
    process.env.HERCULES_SDK_VERSION ?? "1.0.0",
    process.env.HERCULES_AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "simple:notion",
    "Read and write Notion pages, query databases, and trigger flows by polling for changes.",
    [{ code: "en-US", content: "Notion" }],
    []
)

registerNotionSupportingDataTypes(action)
action.registerDataTypeClass(NotionRichTextDataType)
action.registerDataTypeClass(NotionPropertyValueDataType)
action.registerDataTypeClass(NotionUserDataType)
action.registerDataTypeClass(NotionPageDataType)
action.registerDataTypeClass(NotionDatabaseDataType)
action.registerDataTypeClass(NotionQueryResultDataType)
action.registerDataTypeClass(NotionSearchResultDataType)
action.registerDataTypeClass(NotionFilterDataType)
action.registerDataTypeClass(NotionSearchFilterDataType)
action.registerRuntimeFunction(NotionCreatePageFunction)
action.registerRuntimeFunction(NotionUpdatePageFunction)
action.registerRuntimeFunction(NotionGetPageFunction)
action.registerRuntimeFunction(NotionArchivePageFunction)
action.registerRuntimeFunction(NotionQueryDatabaseFunction)
action.registerRuntimeFunction(NotionSearchFunction)
// Hercules registers both the runtime event and its public event definition.
action.registerRuntimeEventClass(NotionDatabaseItemCreated)
action.registerRuntimeEventClass(NotionDatabaseItemUpdated)
action.registerRuntimeEventClass(NotionPagePropertyChanged)

if (!isExportMode()) {
    const poller = new NotionPoller(action, pollIntervalFromEnv())
    let retry: ReturnType<typeof setTimeout> | undefined
    let stopping = false

    const connect = () => {
        if (!stopping)
            void action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((error: Error) => {
                action.emit(CodeZeroEvent.error, error)
            })
    }

    action.on(CodeZeroEvent.connected, () => {
        if (retry) clearTimeout(retry)
        retry = undefined
        console.log("Notion action connected to Aquila")
        poller.start()
    })
    action.on(CodeZeroEvent.error, (error: Error) => {
        console.error("Aquila connection failed; reconnecting in 5 seconds.", error?.message ?? error)
        poller.stop()
        if (!stopping && !retry)
            retry = setTimeout(() => {
                retry = undefined
                connect()
            }, 5000)
    })
    const shutdown = () => {
        stopping = true
        if (retry) clearTimeout(retry)
        poller.stop()
        // The Hercules SDK has no public disconnect method.
        process.exit(0)
    }
    process.once("SIGINT", shutdown)
    process.once("SIGTERM", shutdown)
    connect()
}
