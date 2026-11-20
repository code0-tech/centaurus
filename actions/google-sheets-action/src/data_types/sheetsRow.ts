import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const SheetsRowSchema = z.object({
    spreadsheetId: z.string().nullish().describe("The id of the spreadsheet the row belongs to."),
    range: z.string().nullish().describe("The A1 range the row was read from."),
    rowNumber: z
        .number()
        .nullish()
        .describe("The 1-based row number within the sheet, or null when no matching row was found."),
    matched: z.boolean().default(false).describe("Whether a matching row was found."),
    values: z.array(z.string()).default([]).describe("The cell values of the row as an array of strings."),
});
export type SheetsRow = z.infer<typeof SheetsRowSchema>;

@Identifier("SHEETS_ROW")
@Name({ code: "en-US", content: "Sheets row" })
@DisplayMessage({ code: "en-US", content: "Row ${rowNumber}" })
@Schema(SheetsRowSchema)
export class SheetsRowDataType {}
