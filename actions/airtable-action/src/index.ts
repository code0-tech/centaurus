import "reflect-metadata"
import { Action, CodeZeroEvent, isExportMode } from "@code0-tech/hercules"

import { AirtablePollingManager } from "./polling.js"

import { AirtableFieldMap } from "./data_types/airtableFieldMap.js"
import { AirtableRecord } from "./data_types/airtableRecord.js"
import { AirtableRecordList } from "./data_types/airtableRecordList.js"
import { AirtableSort } from "./data_types/airtableSort.js"
import { AirtableAttachment } from "./data_types/airtableAttachment.js"
import { AirtableField } from "./data_types/airtableField.js"
import { AirtableView } from "./data_types/airtableView.js"
import { AirtableTable } from "./data_types/airtableTable.js"
import { AirtableBase } from "./data_types/airtableBase.js"

import { AirtableCreateRecordFunction } from "./functions/records/airtableCreateRecord.js"
import { AirtableCreateRecordsFunction } from "./functions/records/airtableCreateRecords.js"
import { AirtableGetRecordFunction } from "./functions/records/airtableGetRecord.js"
import { AirtableUpdateRecordFunction } from "./functions/records/airtableUpdateRecord.js"
import { AirtableDeleteRecordFunction } from "./functions/records/airtableDeleteRecord.js"
import { AirtableListRecordsFunction } from "./functions/records/airtableListRecords.js"
import { AirtableFindRecordFunction } from "./functions/records/airtableFindRecord.js"
import { AirtableUpsertRecordFunction } from "./functions/records/airtableUpsertRecord.js"
import { AirtableListBasesFunction } from "./functions/meta/airtableListBases.js"
import { AirtableGetTablesFunction } from "./functions/meta/airtableGetTables.js"
import { AirtableCreateFieldMapFunction } from "./functions/utils/airtableCreateFieldMap.js"
import { AirtableCreateSortFunction } from "./functions/utils/airtableCreateSort.js"
import { AirtableCreateAttachmentFunction } from "./functions/utils/airtableCreateAttachment.js"

import { AirtableRecordCreated } from "./events/airtableRecordCreated.js"
import { AirtableRecordUpdated } from "./events/airtableRecordUpdated.js"

const action = new Action(
    process.env.ACTION_ID ?? "airtable-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "simple:airtable",
    "Airtable integration: create, read, update and search records, and react to new and changed records.",
    [{ code: "en-US", content: "Airtable" }],
    []
)

// Registered before the types that reference them, so those reference the
// identifier instead of inlining the schema.
action.registerDataTypeClass(AirtableFieldMap)
action.registerDataTypeClass(AirtableRecord)
action.registerDataTypeClass(AirtableRecordList)
action.registerDataTypeClass(AirtableSort)
action.registerDataTypeClass(AirtableAttachment)
action.registerDataTypeClass(AirtableField)
action.registerDataTypeClass(AirtableView)
action.registerDataTypeClass(AirtableTable)
action.registerDataTypeClass(AirtableBase)

action.registerRuntimeFunction(AirtableCreateRecordFunction)
action.registerRuntimeFunction(AirtableCreateRecordsFunction)
action.registerRuntimeFunction(AirtableGetRecordFunction)
action.registerRuntimeFunction(AirtableUpdateRecordFunction)
action.registerRuntimeFunction(AirtableDeleteRecordFunction)
action.registerRuntimeFunction(AirtableListRecordsFunction)
action.registerRuntimeFunction(AirtableFindRecordFunction)
action.registerRuntimeFunction(AirtableUpsertRecordFunction)
action.registerRuntimeFunction(AirtableListBasesFunction)
action.registerRuntimeFunction(AirtableGetTablesFunction)
action.registerRuntimeFunction(AirtableCreateFieldMapFunction)
action.registerRuntimeFunction(AirtableCreateSortFunction)
action.registerRuntimeFunction(AirtableCreateAttachmentFunction)

action.registerRuntimeEventClass(AirtableRecordCreated)
action.registerRuntimeEventClass(AirtableRecordUpdated)

// Airtable has no push events for personal access tokens, so the tables the
// trigger flows watch are polled; the manager follows the flows Aquila sends.
const pollingManager = new AirtablePollingManager(action)
if (!isExportMode()) {
    pollingManager.start()
}

// Stop polling on shutdown, so no poll fires flows while the action goes down.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
        pollingManager.stop()
        process.exit(0)
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
