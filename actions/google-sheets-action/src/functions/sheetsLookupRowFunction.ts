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
import { lookupRow } from "../helpers.js";
import { SheetsRow } from "../data_types/sheetsRow.js";

@Identifier("sheetsLookupRow")
@DisplayIcon("simple:googlesheets")
@Signature("(spreadsheetId: string, sheetName: string, column: string, value: string): SHEETS_ROW")
@Name({ code: "en-US", content: "Lookup row" })
@DisplayMessage({ code: "en-US", content: "Lookup ${value} in ${sheetName}" })
@Documentation({
    code: "en-US",
    content:
        "Returns the first row in a sheet whose cell in the given column equals `value`. The returned row carries `matched: false` and a null `rowNumber` when nothing matches. `column` may be an A1 column letter (e.g. B) or a 1-based index.",
})
@Description({ code: "en-US", content: "Finds the first row where a column equals a value." })
@Parameter({
    runtimeName: "spreadsheetId",
    name: [{ code: "en-US", content: "Spreadsheet ID" }],
    description: [{ code: "en-US", content: "The id of the spreadsheet (from its URL)." }],
})
@Parameter({
    runtimeName: "sheetName",
    name: [{ code: "en-US", content: "Sheet name" }],
    description: [{ code: "en-US", content: "The name of the sheet (tab) to search, e.g. Sheet1." }],
})
@Parameter({
    runtimeName: "column",
    name: [{ code: "en-US", content: "Column" }],
    description: [{ code: "en-US", content: "The column to match against, as an A1 letter (e.g. B) or 1-based index." }],
})
@Parameter({
    runtimeName: "value",
    name: [{ code: "en-US", content: "Value" }],
    description: [{ code: "en-US", content: "The value to search for in the column." }],
})
export class SheetsLookupRowFunction {
    async run(
        context: FunctionContext,
        spreadsheetId: string,
        sheetName: string,
        column: string,
        value: string
    ): Promise<SheetsRow> {
        try {
            return await lookupRow(spreadsheetId, sheetName, column, value, context);
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            if (error instanceof Error) {
                throw new RuntimeError("ERROR_LOOKING_UP_SHEETS_ROW", error.message);
            }
            throw new RuntimeError("ERROR_LOOKING_UP_SHEETS_ROW", "An error occurred while looking up the row.");
        }
    }
}
