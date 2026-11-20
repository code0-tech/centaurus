import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const SheetsUpdateResultSchema = z.object({
    spreadsheetId: z.string().describe("The id of the spreadsheet that was updated."),
    updatedRange: z.string().describe("The range that was written, in A1 notation."),
    updatedRows: z.number().default(0).describe("The number of rows where at least one cell was written."),
    updatedColumns: z.number().default(0).describe("The number of columns where at least one cell was written."),
    updatedCells: z.number().default(0).describe("The total number of cells that were written."),
});
export type SheetsUpdateResult = z.infer<typeof SheetsUpdateResultSchema>;

@Identifier("SHEETS_UPDATE_RESULT")
@Name({ code: "en-US", content: "Sheets update result" })
@DisplayMessage({ code: "en-US", content: "Updated ${updatedCells} cells in ${updatedRange}" })
@Schema(SheetsUpdateResultSchema)
export class SheetsUpdateResultDataType {}
