import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const SheetsValueRangeSchema = z.object({
    range: z.string().describe("The range the values cover, in A1 notation (e.g. Sheet1!A1:C10)."),
    majorDimension: z
        .enum(["ROWS", "COLUMNS"])
        .default("ROWS")
        .describe("Whether the outer array of `values` represents rows or columns."),
    values: z
        .array(z.array(z.string()))
        .default([])
        .describe("The cell values as a two-dimensional array of strings, ordered by `majorDimension`."),
});
export type SheetsValueRange = z.infer<typeof SheetsValueRangeSchema>;

@Identifier("SHEETS_VALUE_RANGE")
@Name({ code: "en-US", content: "Sheets value range" })
@DisplayMessage({ code: "en-US", content: "Value range ${range}" })
@Schema(SheetsValueRangeSchema)
export class SheetsValueRangeDataType {}
