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

/**
 * Sheet names that contain anything other than letters, digits and underscores
 * must be wrapped in single quotes in A1 notation, with embedded quotes doubled.
 */
function quoteSheetName(sheetName: string): string {
    if (/^[A-Za-z0-9_]+$/.test(sheetName)) {
        return sheetName;
    }
    return `'${sheetName.replace(/'/g, "''")}'`;
}

@Identifier("sheetsCreateA1Range")
@DisplayIcon("simple:googlesheets")
@Signature(
    "(sheetName: string, startColumn: string, startRow: number, endColumn?: string, endRow?: number): TEXT"
)
@Name({ code: "en-US", content: "Create A1 range" })
@DisplayMessage({ code: "en-US", content: "Create A1 range for ${sheetName}" })
@Documentation({
    code: "en-US",
    content:
        "Builds an A1-notation range string (e.g. Sheet1!A1:C3). When `endColumn`/`endRow` are omitted a single-cell range is built (e.g. Sheet1!A1). Sheet names with spaces or symbols are quoted automatically.",
})
@Description({ code: "en-US", content: "Builds an A1-notation range string." })
@Parameter({
    runtimeName: "sheetName",
    name: [{ code: "en-US", content: "Sheet name" }],
    description: [{ code: "en-US", content: "The name of the sheet (tab), e.g. Sheet1." }],
})
@Parameter({
    runtimeName: "startColumn",
    name: [{ code: "en-US", content: "Start column" }],
    description: [{ code: "en-US", content: "The first column as an A1 letter, e.g. A." }],
})
@Parameter({
    runtimeName: "startRow",
    name: [{ code: "en-US", content: "Start row" }],
    description: [{ code: "en-US", content: "The first row as a 1-based number." }],
})
@Parameter({
    runtimeName: "endColumn",
    name: [{ code: "en-US", content: "End column" }],
    description: [{ code: "en-US", content: "The last column as an A1 letter. Omit for a single-cell range." }],
    optional: true,
})
@Parameter({
    runtimeName: "endRow",
    name: [{ code: "en-US", content: "End row" }],
    description: [{ code: "en-US", content: "The last row as a 1-based number. Omit for a single-cell range." }],
    optional: true,
})
export class SheetsCreateA1RangeFunction {
    run(
        _context: unknown,
        sheetName: string,
        startColumn: string,
        startRow: number,
        endColumn?: string,
        endRow?: number
    ): string {
        const start = `${startColumn.toUpperCase()}${startRow}`;
        const prefix = `${quoteSheetName(sheetName)}!`;

        if (endColumn === undefined && endRow === undefined) {
            return `${prefix}${start}`;
        }

        const end = `${(endColumn ?? startColumn).toUpperCase()}${endRow ?? startRow}`;
        return `${prefix}${start}:${end}`;
    }
}
