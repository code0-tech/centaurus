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
import { clearRange } from "../helpers.js";

@Identifier("sheetsClearRange")
@DisplayIcon("simple:googlesheets")
@Signature("(spreadsheetId: string, range: string): BOOLEAN")
@Name({ code: "en-US", content: "Clear range" })
@DisplayMessage({ code: "en-US", content: "Clear ${range}" })
@Documentation({
    code: "en-US",
    content: "Clears the values of a range given in A1 notation, keeping cell formatting. Returns true on success.",
})
@Description({ code: "en-US", content: "Clears the values of a range in A1 notation." })
@Parameter({
    runtimeName: "spreadsheetId",
    name: [{ code: "en-US", content: "Spreadsheet ID" }],
    description: [{ code: "en-US", content: "The id of the spreadsheet (from its URL)." }],
})
@Parameter({
    runtimeName: "range",
    name: [{ code: "en-US", content: "Range" }],
    description: [{ code: "en-US", content: "The range to clear, in A1 notation, e.g. Sheet1!A1:C10." }],
})
export class SheetsClearRangeFunction {
    async run(context: FunctionContext, spreadsheetId: string, range: string): Promise<boolean> {
        try {
            return await clearRange(spreadsheetId, range, context);
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            if (error instanceof Error) {
                throw new RuntimeError("ERROR_CLEARING_SHEETS_RANGE", error.message);
            }
            throw new RuntimeError("ERROR_CLEARING_SHEETS_RANGE", "An error occurred while clearing the range.");
        }
    }
}
