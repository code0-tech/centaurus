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
import { batchUpdate } from "../helpers.js";
import { SheetsBatchResult } from "../data_types/sheetsBatchResult.js";

@Identifier("sheetsBatchUpdate")
@DisplayIcon("simple:googlesheets")
@Signature("(spreadsheetId: string, requests: LIST<OBJECT<{}>>): SHEETS_BATCH_RESULT")
@Name({ code: "en-US", content: "Batch update" })
@DisplayMessage({ code: "en-US", content: "Batch update ${spreadsheetId}" })
@Documentation({
    code: "en-US",
    content:
        "Applies a list of raw Google Sheets API requests (e.g. addSheet, repeatCell, mergeCells) to the spreadsheet in a single batchUpdate call. Each request is a request object from the Sheets API.",
})
@Description({ code: "en-US", content: "Applies a list of raw Sheets API requests in one batchUpdate call." })
@Parameter({
    runtimeName: "spreadsheetId",
    name: [{ code: "en-US", content: "Spreadsheet ID" }],
    description: [{ code: "en-US", content: "The id of the spreadsheet (from its URL)." }],
})
@Parameter({
    runtimeName: "requests",
    name: [{ code: "en-US", content: "Requests" }],
    description: [{ code: "en-US", content: "The list of Sheets API request objects to apply, in order." }],
})
export class SheetsBatchUpdateFunction {
    async run(
        context: FunctionContext,
        spreadsheetId: string,
        requests: Record<string, unknown>[]
    ): Promise<SheetsBatchResult> {
        try {
            return await batchUpdate(spreadsheetId, requests ?? [], context);
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            if (error instanceof Error) {
                throw new RuntimeError("ERROR_BATCH_UPDATING_SHEETS", error.message);
            }
            throw new RuntimeError("ERROR_BATCH_UPDATING_SHEETS", "An error occurred while applying the batch update.");
        }
    }
}
