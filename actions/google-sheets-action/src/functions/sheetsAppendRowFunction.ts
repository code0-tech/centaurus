import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { appendRow } from "../helpers.js";
import { SheetsUpdateResult } from "../data_types/sheetsUpdateResult.js";

@Identifier("sheetsAppendRow")
@DisplayIcon("simple:googlesheets")
@Signature("(spreadsheetId: string, sheetName: string, values: LIST<TEXT>): SHEETS_UPDATE_RESULT")
@Name({ code: "en-US", content: "Append row" })
@DisplayMessage({ code: "en-US", content: "Append row to ${sheetName}" })
@Documentation({
    code: "en-US",
    content:
        "Appends a single row of values to the first table found in the given sheet, after the last row with data.",
})
@Description({ code: "en-US", content: "Appends a row of values to a sheet." })
@Parameter({
    runtimeName: "spreadsheetId",
    name: [{ code: "en-US", content: "Spreadsheet ID" }],
    description: [{ code: "en-US", content: "The id of the spreadsheet (from its URL)." }],
})
@Parameter({
    runtimeName: "sheetName",
    name: [{ code: "en-US", content: "Sheet name" }],
    description: [{ code: "en-US", content: "The name of the sheet (tab) to append to, e.g. Sheet1." }],
})
@Parameter({
    runtimeName: "values",
    name: [{ code: "en-US", content: "Values" }],
    description: [{ code: "en-US", content: "The cell values of the row to append, left to right." }],
})
export class SheetsAppendRowFunction {
    async run(
        context: FunctionContext,
        spreadsheetId: string,
        sheetName: string,
        values: string[]
    ): Promise<SheetsUpdateResult> {
        try {
            return await appendRow(spreadsheetId, sheetName, values ?? [], context);
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            if (error instanceof Error) {
                throw new RuntimeError("ERROR_APPENDING_SHEETS_ROW", error.message);
            }
            throw new RuntimeError("ERROR_APPENDING_SHEETS_ROW", "An error occurred while appending the row.");
        }
    }
}
