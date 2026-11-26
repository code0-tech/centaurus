import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { requireId } from "../../client.js";
import { formulaField, formulaString, handleAirtableError, listRecords } from "../../helpers.js";
import { AirtableRecordType } from "../../data_types/airtableRecord.js";
import { API_TOKEN_PARAMETER, BASE_ID_PARAMETER, TABLE_ID_PARAMETER } from "../parameters.js";

@Identifier("airtableFindRecord")
@Signature("(apiToken: string, baseId: string, tableId: string, field: string, value: string): AIRTABLE_RECORD")
@Name({ code: "en-US", content: "Find record" })
@DisplayIcon("simple:airtable")
@DisplayMessage({ code: "en-US", content: "Find record where ${field} is ${value}" })
@Documentation({
    code: "en-US",
    content:
        "Finds the first record whose field equals the value. The cell is compared as text, so a number field matches `42`. Fails with AIRTABLE_RECORD_NOT_FOUND if no record matches.",
})
@Description({ code: "en-US", content: "Find a record by the value of a field." })
@Parameter(API_TOKEN_PARAMETER)
@Parameter(BASE_ID_PARAMETER)
@Parameter(TABLE_ID_PARAMETER)
@Parameter({
    runtimeName: "field",
    name: [{ code: "en-US", content: "Field" }],
    description: [{ code: "en-US", content: "The name of the field to search in." }],
})
@Parameter({
    runtimeName: "value",
    name: [{ code: "en-US", content: "Value" }],
    description: [{ code: "en-US", content: "The value the field has to have." }],
})
export class AirtableFindRecordFunction {
    async run(
        _context: unknown,
        apiToken: string,
        baseId: string,
        tableId: string,
        field: string,
        value: string
    ): Promise<AirtableRecordType> {
        try {
            const [record] = await listRecords(apiToken, baseId, tableId, {
                filterByFormula: findFormula(field, value),
                maxRecords: 1,
            });

            if (!record) {
                throw new RuntimeError("AIRTABLE_RECORD_NOT_FOUND", `No record has ${field} = "${value}".`);
            }
            return record;
        } catch (error) {
            return handleAirtableError(error, "AIRTABLE_FIND_RECORD_FAILED", "Failed to search the Airtable records.");
        }
    }
}

/** `{field} & ""` turns the cell into text, so every field type compares the same way. */
export function findFormula(field: string, value: unknown): string {
    const text = value === undefined || value === null ? "" : String(value);
    return `${formulaField(requireId(field, "field"))} & "" = ${formulaString(text)}`;
}
