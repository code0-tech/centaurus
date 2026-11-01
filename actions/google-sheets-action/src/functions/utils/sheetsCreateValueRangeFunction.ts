import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import { SheetsValueRange, SheetsValueRangeSchema } from "../../data_types/sheetsValueRange.js";

@Identifier("sheetsCreateValueRange")
@DisplayIcon("simple:googlesheets")
@Signature("(range: string, values: LIST<LIST<TEXT>>, majorDimension?: string): SHEETS_VALUE_RANGE")
@Name({ code: "en-US", content: "Create value range" })
@DisplayMessage({ code: "en-US", content: "Create value range for ${range}" })
@Documentation({
    code: "en-US",
    content:
        "Builds a `SHEETS_VALUE_RANGE` object from a range and a list of rows, for use with the update functions. `majorDimension` defaults to ROWS.",
})
@Description({ code: "en-US", content: "Builds a Sheets value range object." })
@Parameter({
    runtimeName: "range",
    name: [{ code: "en-US", content: "Range" }],
    description: [{ code: "en-US", content: "The range the values cover, in A1 notation." }],
})
@Parameter({
    runtimeName: "values",
    name: [{ code: "en-US", content: "Values" }],
    description: [{ code: "en-US", content: "The rows of cell values." }],
})
@Parameter({
    runtimeName: "majorDimension",
    name: [{ code: "en-US", content: "Major dimension" }],
    description: [{ code: "en-US", content: "Whether the outer list represents ROWS (default) or COLUMNS." }],
    optional: true,
})
export class SheetsCreateValueRangeFunction {
    run(_context: unknown, range: string, values: string[][], majorDimension?: string): SheetsValueRange {
        return SheetsValueRangeSchema.parse({
            range,
            majorDimension: majorDimension === "COLUMNS" ? "COLUMNS" : "ROWS",
            values: values ?? [],
        });
    }
}
