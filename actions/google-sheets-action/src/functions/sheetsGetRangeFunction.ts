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
import { getRange } from "../helpers.js";
import { SheetsValueRange } from "../data_types/sheetsValueRange.js";

@Identifier("sheetsGetRange")
@DisplayIcon("simple:googlesheets")
@Signature("(spreadsheetId: string, range: string): SHEETS_VALUE_RANGE")
@Name({ code: "en-US", content: "Get range" })
@DisplayMessage({ code: "en-US", content: "Get ${range}" })
@Documentation({
    code: "en-US",
    content: "Reads the values of a range given in A1 notation (e.g. Sheet1!A1:C10) and returns them as a value range.",
})
@Description({ code: "en-US", content: "Reads the values of a range in A1 notation." })
@Parameter({
    runtimeName: "spreadsheetId",
    name: [{ code: "en-US", content: "Spreadsheet ID" }],
    description: [{ code: "en-US", content: "The id of the spreadsheet (from its URL)." }],
})
@Parameter({
    runtimeName: "range",
    name: [{ code: "en-US", content: "Range" }],
    description: [{ code: "en-US", content: "The range to read, in A1 notation, e.g. Sheet1!A1:C10." }],
})
export class SheetsGetRangeFunction {
    async run(context: FunctionContext, spreadsheetId: string, range: string): Promise<SheetsValueRange> {
        try {
            return await getRange(spreadsheetId, range, context);
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            if (error instanceof Error) {
                throw new RuntimeError("ERROR_READING_SHEETS_RANGE", error.message);
            }
            throw new RuntimeError("ERROR_READING_SHEETS_RANGE", "An error occurred while reading the range.");
        }
    }
}
