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
import { createSheet } from "../helpers.js";
import { SheetsSheet } from "../data_types/sheetsSheet.js";

@Identifier("sheetsCreateSheet")
@DisplayIcon("simple:googlesheets")
@Signature("(spreadsheetId: string, title: string): SHEETS_SHEET")
@Name({ code: "en-US", content: "Create sheet" })
@DisplayMessage({ code: "en-US", content: "Create sheet ${title}" })
@Documentation({
    code: "en-US",
    content: "Adds a new sheet (tab) with the given title to the spreadsheet and returns its properties.",
})
@Description({ code: "en-US", content: "Adds a new sheet (tab) to a spreadsheet." })
@Parameter({
    runtimeName: "spreadsheetId",
    name: [{ code: "en-US", content: "Spreadsheet ID" }],
    description: [{ code: "en-US", content: "The id of the spreadsheet (from its URL)." }],
})
@Parameter({
    runtimeName: "title",
    name: [{ code: "en-US", content: "Title" }],
    description: [{ code: "en-US", content: "The title of the new sheet (tab). Must be unique within the spreadsheet." }],
})
export class SheetsCreateSheetFunction {
    async run(context: FunctionContext, spreadsheetId: string, title: string): Promise<SheetsSheet> {
        try {
            return await createSheet(spreadsheetId, title, context);
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            if (error instanceof Error) {
                throw new RuntimeError("ERROR_CREATING_SHEETS_SHEET", error.message);
            }
            throw new RuntimeError("ERROR_CREATING_SHEETS_SHEET", "An error occurred while creating the sheet.");
        }
    }
}
