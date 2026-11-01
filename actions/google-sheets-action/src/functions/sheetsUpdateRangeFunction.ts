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
import { updateRange } from "../helpers.js";
import { SheetsUpdateResult } from "../data_types/sheetsUpdateResult.js";

@Identifier("sheetsUpdateRange")
@DisplayIcon("simple:googlesheets")
@Signature("(spreadsheetId: string, range: string, values: LIST<LIST<TEXT>>): SHEETS_UPDATE_RESULT")
@Name({ code: "en-US", content: "Update range" })
@DisplayMessage({ code: "en-US", content: "Update ${range}" })
@Documentation({
    code: "en-US",
    content:
        "Overwrites the values of a range given in A1 notation (e.g. Sheet1!A1:C3). `values` is a list of rows, each a list of cell values.",
})
@Description({ code: "en-US", content: "Overwrites the values of a range in A1 notation." })
@Parameter({
    runtimeName: "spreadsheetId",
    name: [{ code: "en-US", content: "Spreadsheet ID" }],
    description: [{ code: "en-US", content: "The id of the spreadsheet (from its URL)." }],
})
@Parameter({
    runtimeName: "range",
    name: [{ code: "en-US", content: "Range" }],
    description: [{ code: "en-US", content: "The range to write, in A1 notation, e.g. Sheet1!A1:C3." }],
})
@Parameter({
    runtimeName: "values",
    name: [{ code: "en-US", content: "Values" }],
    description: [{ code: "en-US", content: "The rows to write, each a list of cell values." }],
})
export class SheetsUpdateRangeFunction {
    async run(
        context: FunctionContext,
        spreadsheetId: string,
        range: string,
        values: string[][]
    ): Promise<SheetsUpdateResult> {
        try {
            return await updateRange(spreadsheetId, range, values ?? [], context);
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            if (error instanceof Error) {
                throw new RuntimeError("ERROR_UPDATING_SHEETS_RANGE", error.message);
            }
            throw new RuntimeError("ERROR_UPDATING_SHEETS_RANGE", "An error occurred while updating the range.");
        }
    }
}
