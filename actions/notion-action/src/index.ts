import "reflect-metadata"
import { Action, CodeZeroEvent, isExportMode } from "@code0-tech/hercules"
import { registerNotionSupportingDataTypes } from "./data_types/generatedSupportingDataTypes.js"
import { NotionRichTextDataType } from "./data_types/notionRichText.js"
import { NotionPropertyValueDataType } from "./data_types/notionPropertyValue.js"
import { NotionUserDataType } from "./data_types/notionUser.js"
import { NotionPageDataType } from "./data_types/notionPage.js"
import { NotionDatabaseDataType } from "./data_types/notionDatabase.js"
import { NotionBlockDataType } from "./data_types/notionBlock.js"
import { NotionBlockListDataType } from "./data_types/notionBlockList.js"
import { NotionQueryResultDataType } from "./data_types/notionQueryResult.js"
import { NotionSearchResultDataType } from "./data_types/notionSearchResult.js"
import { NotionPropertiesDataType } from "./data_types/notionProperties.js"
import { NotionFilterDataType } from "./data_types/notionFilter.js"
import { NotionSortDataType } from "./data_types/notionSort.js"
import { NotionSearchFilterDataType } from "./data_types/notionSearchFilter.js"
import { NotionCreatePageFunction } from "./functions/notionCreatePageFunction.js"
import { NotionUpdatePageFunction } from "./functions/notionUpdatePageFunction.js"
import { NotionGetPageFunction } from "./functions/notionGetPageFunction.js"
import { NotionArchivePageFunction } from "./functions/notionArchivePageFunction.js"
import { NotionQueryDatabaseFunction } from "./functions/notionQueryDatabaseFunction.js"
import { NotionAppendBlocksFunction } from "./functions/notionAppendBlocksFunction.js"
import { NotionSearchFunction } from "./functions/notionSearchFunction.js"
import { NotionCreateRichTextFunction } from "./functions/utils/notionCreateRichTextFunction.js"
import { NotionCreatePropertyValueFunction } from "./functions/utils/notionCreatePropertyValueFunction.js"
import { NotionDatabaseItemCreated } from "./events/notionDatabaseItemCreated.js"
import { NotionDatabaseItemUpdated } from "./events/notionDatabaseItemUpdated.js"
import { NotionPagePropertyChanged } from "./events/notionPagePropertyChanged.js"
import { NotionPoller } from "./polling.js"

export const action = new Action(
    process.env.HERCULES_ACTION_ID ?? "notion-action",
    process.env.HERCULES_SDK_VERSION ?? "1.0.0",
    process.env.HERCULES_AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "simple:notion",
    "Read and write Notion pages, query databases, and trigger flows by polling for changes.",
    [{ code: "en-US", content: "Notion" }],
    [
        {
            identifier: "integration_token",
            type: "TEXT",
            name: [{ code: "en-US", content: "Integration token" }],
            description: [{ code: "en-US", content: "Internal integration bearer token. Falls back to NOTION_INTEGRATION_TOKEN in the action process." }],
            linkedDataTypes: ["TEXT"],
        },
    ]
)

registerNotionSupportingDataTypes(action)
action.registerDataTypeClass(NotionRichTextDataType)
action.registerDataTypeClass(NotionPropertyValueDataType)
action.registerDataTypeClass(NotionUserDataType)
action.registerDataTypeClass(NotionPageDataType)
action.registerDataTypeClass(NotionDatabaseDataType)
action.registerDataTypeClass(NotionBlockDataType)
action.registerDataTypeClass(NotionBlockListDataType)
action.registerDataTypeClass(NotionQueryResultDataType)
action.registerDataTypeClass(NotionSearchResultDataType)
action.registerDataTypeClass(NotionPropertiesDataType)
action.registerDataTypeClass(NotionFilterDataType)
action.registerDataTypeClass(NotionSortDataType)
action.registerDataTypeClass(NotionSearchFilterDataType)
action.registerRuntimeFunction(NotionCreatePageFunction)
action.registerRuntimeFunction(NotionUpdatePageFunction)
action.registerRuntimeFunction(NotionGetPageFunction)
action.registerRuntimeFunction(NotionArchivePageFunction)
action.registerRuntimeFunction(NotionQueryDatabaseFunction)
action.registerRuntimeFunction(NotionAppendBlocksFunction)
action.registerRuntimeFunction(NotionSearchFunction)
action.registerRuntimeFunction(NotionCreateRichTextFunction)
action.registerRuntimeFunction(NotionCreatePropertyValueFunction)
// Hercules registers both the runtime event and its public event definition.
action.registerRuntimeEventClass(NotionDatabaseItemCreated)
action.registerRuntimeEventClass(NotionDatabaseItemUpdated)
action.registerRuntimeEventClass(NotionPagePropertyChanged)

if (!isExportMode()) {
    const poller = new NotionPoller(action)
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
    action.on(CodeZeroEvent.error, () => {
        console.error("Aquila connection failed; reconnecting in 5 seconds.")
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
