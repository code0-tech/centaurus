import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { handleAirtableError, listRecords, parseSort } from "../../helpers.js";
import { AirtableRecordListType } from "../../data_types/airtableRecordList.js";
import { AirtableSortType } from "../../data_types/airtableSort.js";
import { API_TOKEN_PARAMETER, BASE_ID_PARAMETER, TABLE_ID_PARAMETER } from "../parameters.js";

const DEFAULT_MAX_RECORDS = 100;

@Identifier("airtableListRecords")
@Signature("(apiToken: string, baseId: string, tableId: string, filterByFormula?: string, view?: string, sort?: AIRTABLE_SORT[], maxRecords?: number): AIRTABLE_RECORD_LIST")
@Name({ code: "en-US", content: "List records" })
@DisplayIcon("simple:airtable")
@DisplayMessage({ code: "en-US", content: "List records of ${tableId}" })
@Documentation({
    code: "en-US",
    content:
        "Reads the records of a table, optionally filtered by an Airtable formula, limited to a view and sorted. Reads 100 records unless `maxRecords` asks for more; more than 100 are read page by page.",
})
@Description({ code: "en-US", content: "Read the records of a table." })
@Parameter(API_TOKEN_PARAMETER)
@Parameter(BASE_ID_PARAMETER)
@Parameter(TABLE_ID_PARAMETER)
@Parameter({
    runtimeName: "filterByFormula",
    name: [{ code: "en-US", content: "Filter formula" }],
    description: [
        { code: "en-US", content: 'Only read records for which this Airtable formula is true, e.g. `{Status} = "Done"`.' },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "view",
    name: [{ code: "en-US", content: "View" }],
    description: [{ code: "en-US", content: "Only read the records of this view (name or ID), in its order." }],
    optional: true,
})
@Parameter({
    runtimeName: "sort",
    name: [{ code: "en-US", content: "Sort" }],
    description: [{ code: "en-US", content: "The fields to sort by, see `airtableCreateSort`." }],
    optional: true,
})
@Parameter({
    runtimeName: "maxRecords",
    name: [{ code: "en-US", content: "Maximum records" }],
    description: [{ code: "en-US", content: "How many records to read at most. Empty reads 100." }],
    optional: true,
})
export class AirtableListRecordsFunction {
    async run(
        _context: unknown,
        apiToken: string,
        baseId: string,
        tableId: string,
        filterByFormula?: string,
        view?: string,
        sort?: AirtableSortType[] | string,
        maxRecords?: number
    ): Promise<AirtableRecordListType> {
        try {
            const records = await listRecords(apiToken, baseId, tableId, {
                filterByFormula: filterByFormula?.trim() || undefined,
                view: view?.trim() || undefined,
                sort: parseSort(sort),
                maxRecords: boundedMaxRecords(maxRecords),
            });

            return { records };
        } catch (error) {
            return handleAirtableError(error, "AIRTABLE_LIST_RECORDS_FAILED", "Failed to read the Airtable records.");
        }
    }
}

export function boundedMaxRecords(maxRecords?: number | null): number {
    if (maxRecords === undefined || maxRecords === null || Number.isNaN(Number(maxRecords))) {
        return DEFAULT_MAX_RECORDS;
    }
    return Math.max(Math.trunc(Number(maxRecords)), 1);
}
