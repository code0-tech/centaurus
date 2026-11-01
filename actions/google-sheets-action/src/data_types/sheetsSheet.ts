import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const SheetsSheetSchema = z.object({
    sheetId: z.number().describe("The numeric id of the sheet (tab) within the spreadsheet."),
    title: z.string().describe("The name of the sheet (tab)."),
    index: z.number().nullish().describe("The zero-based position of the sheet within the spreadsheet."),
    sheetType: z.string().nullish().describe("The type of the sheet, e.g. GRID."),
    rowCount: z.number().nullish().describe("The number of rows in the sheet grid."),
    columnCount: z.number().nullish().describe("The number of columns in the sheet grid."),
});
export type SheetsSheet = z.infer<typeof SheetsSheetSchema>;

@Identifier("SHEETS_SHEET")
@Name({ code: "en-US", content: "Sheets sheet" })
@DisplayMessage({ code: "en-US", content: "Sheet ${title}" })
@Schema(SheetsSheetSchema)
export class SheetsSheetDataType {}
