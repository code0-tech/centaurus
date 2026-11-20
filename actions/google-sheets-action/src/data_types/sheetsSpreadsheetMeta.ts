import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { SheetsSheetSchema } from "./sheetsSheet.js";

export const SheetsSpreadsheetMetaSchema = z.object({
    spreadsheetId: z.string().describe("The id of the spreadsheet."),
    title: z.string().describe("The title of the spreadsheet."),
    locale: z.string().nullish().describe("The locale of the spreadsheet, e.g. en_US."),
    timeZone: z.string().nullish().describe("The time zone of the spreadsheet, e.g. Europe/Berlin."),
    spreadsheetUrl: z.string().nullish().describe("The URL of the spreadsheet."),
    sheets: z.array(SheetsSheetSchema).default([]).describe("The sheets (tabs) contained in the spreadsheet."),
});
export type SheetsSpreadsheetMeta = z.infer<typeof SheetsSpreadsheetMetaSchema>;

@Identifier("SHEETS_SPREADSHEET_META")
@Name({ code: "en-US", content: "Sheets spreadsheet metadata" })
@DisplayMessage({ code: "en-US", content: "Spreadsheet ${title}" })
@Schema(SheetsSpreadsheetMetaSchema)
export class SheetsSpreadsheetMetaDataType {}
