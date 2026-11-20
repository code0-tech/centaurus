import "reflect-metadata";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";

import { SheetsValueRangeDataType } from "./data_types/sheetsValueRange.js";
import { SheetsUpdateResultDataType } from "./data_types/sheetsUpdateResult.js";
import { SheetsBatchResultDataType } from "./data_types/sheetsBatchResult.js";
import { SheetsRowDataType } from "./data_types/sheetsRow.js";
import { SheetsSheetDataType } from "./data_types/sheetsSheet.js";
import { SheetsSpreadsheetMetaDataType } from "./data_types/sheetsSpreadsheetMeta.js";

import { SheetsAppendRowFunction } from "./functions/sheetsAppendRowFunction.js";
import { SheetsUpdateRangeFunction } from "./functions/sheetsUpdateRangeFunction.js";
import { SheetsGetRangeFunction } from "./functions/sheetsGetRangeFunction.js";
import { SheetsLookupRowFunction } from "./functions/sheetsLookupRowFunction.js";
import { SheetsClearRangeFunction } from "./functions/sheetsClearRangeFunction.js";
import { SheetsCreateSheetFunction } from "./functions/sheetsCreateSheetFunction.js";
import { SheetsBatchUpdateFunction } from "./functions/sheetsBatchUpdateFunction.js";
import { SheetsCreateValueRangeFunction } from "./functions/utils/sheetsCreateValueRangeFunction.js";
import { SheetsCreateA1RangeFunction } from "./functions/utils/sheetsCreateA1RangeFunction.js";

import { GoogleSheetsRowAdded } from "./events/googleSheetsRowAdded.js";
import { GoogleSheetsRowUpdated } from "./events/googleSheetsRowUpdated.js";

const action = new Action(
    process.env.ACTION_ID ?? "google-sheets-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "simple:googlesheets",
    "Google Sheets integration: append, read, update, look up, and clear spreadsheet rows via the Google Sheets API using service-account authentication.",
    [{ code: "en-US", content: "Google Sheets" }],
    [
        {
            identifier: "service_account_json",
            type: "TEXT",
            defaultValue: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "",
            name: [{ code: "en-US", content: "Service account JSON" }],
            description: [
                {
                    code: "en-US",
                    content:
                        "The service-account key JSON used to authenticate with the Google Sheets API. The spreadsheets to operate on must be shared with the service account's email.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "scopes",
            type: "TEXT",
            optional: true,
            defaultValue: "https://www.googleapis.com/auth/spreadsheets",
            name: [{ code: "en-US", content: "Scopes" }],
            description: [
                {
                    code: "en-US",
                    content:
                        "The OAuth scopes to request, separated by spaces or commas. Defaults to https://www.googleapis.com/auth/spreadsheets.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
    ]
);

action.registerDataTypeClass(SheetsValueRangeDataType);
action.registerDataTypeClass(SheetsUpdateResultDataType);
action.registerDataTypeClass(SheetsBatchResultDataType);
action.registerDataTypeClass(SheetsRowDataType);
action.registerDataTypeClass(SheetsSheetDataType);
action.registerDataTypeClass(SheetsSpreadsheetMetaDataType);

action.registerRuntimeFunction(SheetsAppendRowFunction);
action.registerRuntimeFunction(SheetsUpdateRangeFunction);
action.registerRuntimeFunction(SheetsGetRangeFunction);
action.registerRuntimeFunction(SheetsLookupRowFunction);
action.registerRuntimeFunction(SheetsClearRangeFunction);
action.registerRuntimeFunction(SheetsCreateSheetFunction);
action.registerRuntimeFunction(SheetsBatchUpdateFunction);
action.registerRuntimeFunction(SheetsCreateValueRangeFunction);
action.registerRuntimeFunction(SheetsCreateA1RangeFunction);

action.registerEventClass(GoogleSheetsRowAdded);
action.registerEventClass(GoogleSheetsRowUpdated);

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
