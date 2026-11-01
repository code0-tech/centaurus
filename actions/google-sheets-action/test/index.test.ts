import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { SheetsCreateA1RangeFunction } from "../src/functions/utils/sheetsCreateA1RangeFunction.js";
import { SheetsCreateValueRangeFunction } from "../src/functions/utils/sheetsCreateValueRangeFunction.js";
import { SheetsValueRangeSchema } from "../src/data_types/sheetsValueRange.js";
import { SheetsUpdateResultSchema } from "../src/data_types/sheetsUpdateResult.js";
import { SheetsRowSchema } from "../src/data_types/sheetsRow.js";

describe("sheetsCreateA1Range", () => {
    const fn = new SheetsCreateA1RangeFunction();

    it("builds a multi-cell range", () => {
        expect(fn.run(undefined, "Sheet1", "a", 1, "C", 3)).toEqual("Sheet1!A1:C3");
    });

    it("builds a single-cell range when the end is omitted", () => {
        expect(fn.run(undefined, "Sheet1", "B", 2)).toEqual("Sheet1!B2");
    });

    it("quotes sheet names that contain spaces or symbols", () => {
        expect(fn.run(undefined, "My Sheet", "A", 1, "B", 2)).toEqual("'My Sheet'!A1:B2");
    });

    it("doubles embedded single quotes in the sheet name", () => {
        expect(fn.run(undefined, "Bob's data", "A", 1)).toEqual("'Bob''s data'!A1");
    });
});

describe("sheetsCreateValueRange", () => {
    const fn = new SheetsCreateValueRangeFunction();

    it("defaults majorDimension to ROWS", () => {
        expect(fn.run(undefined, "Sheet1!A1:B2", [["1", "2"]])).toEqual({
            range: "Sheet1!A1:B2",
            majorDimension: "ROWS",
            values: [["1", "2"]],
        });
    });

    it("accepts COLUMNS as the major dimension", () => {
        expect(fn.run(undefined, "Sheet1!A1:B2", [["1", "2"]], "COLUMNS").majorDimension).toEqual("COLUMNS");
    });

    it("falls back to ROWS for an unknown major dimension", () => {
        expect(fn.run(undefined, "Sheet1!A1", [["1"]], "nonsense").majorDimension).toEqual("ROWS");
    });
});

describe("data type schemas", () => {
    it("fills value range defaults", () => {
        const parsed = SheetsValueRangeSchema.parse({ range: "Sheet1!A1:B2" });
        expect(parsed.majorDimension).toEqual("ROWS");
        expect(parsed.values).toEqual([]);
    });

    it("fills update result counters", () => {
        const parsed = SheetsUpdateResultSchema.parse({ spreadsheetId: "abc", updatedRange: "Sheet1!A1" });
        expect(parsed.updatedCells).toEqual(0);
        expect(parsed.updatedRows).toEqual(0);
    });

    it("defaults a row to unmatched", () => {
        const parsed = SheetsRowSchema.parse({});
        expect(parsed.matched).toEqual(false);
        expect(parsed.values).toEqual([]);
    });
});
