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
import { airtableRequest, requireId, tablePath } from "../../client.js";
import { handleAirtableError, mapRecord, optionalBoolean, parseFieldMap, RawAirtableRecord } from "../../helpers.js";
import { AirtableFieldMapType } from "../../data_types/airtableFieldMap.js";
import { AirtableRecordType } from "../../data_types/airtableRecord.js";
import {
    API_TOKEN_PARAMETER,
    BASE_ID_PARAMETER,
    FIELDS_PARAMETER,
    TABLE_ID_PARAMETER,
    TYPECAST_PARAMETER,
} from "../parameters.js";

@Identifier("airtableUpsertRecord")
@Signature("(apiToken: string, baseId: string, tableId: string, keyField: string, fields: AIRTABLE_FIELD_MAP, typecast?: boolean): AIRTABLE_RECORD")
@Name({ code: "en-US", content: "Create or update record" })
@DisplayIcon("simple:airtable")
@DisplayMessage({ code: "en-US", content: "Create or update record by ${keyField}" })
@Documentation({
    code: "en-US",
    content:
        "Updates the record whose key field has the value given in `fields`, or creates it if there is none. The given fields are merged into an existing record. Airtable fails if more than one record has the key.",
})
@Description({ code: "en-US", content: "Create a record or update the one with the same key." })
@Parameter(API_TOKEN_PARAMETER)
@Parameter(BASE_ID_PARAMETER)
@Parameter(TABLE_ID_PARAMETER)
@Parameter({
    runtimeName: "keyField",
    name: [{ code: "en-US", content: "Key field" }],
    description: [
        { code: "en-US", content: "The name of the field that identifies the record, e.g. `Email`. Must be in `fields`." },
    ],
})
@Parameter(FIELDS_PARAMETER)
@Parameter(TYPECAST_PARAMETER)
export class AirtableUpsertRecordFunction {
    async run(
        _context: unknown,
        apiToken: string,
        baseId: string,
        tableId: string,
        keyField: string,
        fields: AirtableFieldMapType | string,
        typecast?: boolean
    ): Promise<AirtableRecordType> {
        try {
            const key = requireId(keyField, "key field");
            const values = parseFieldMap(fields);
            if (values[key] === undefined || values[key] === null || values[key] === "") {
                throw new RuntimeError("AIRTABLE_MISSING_KEY_VALUE", `The fields have no value for the key field ${key}.`);
            }

            // Airtable's own upsert matches on the key field and creates or
            // updates in one request - no window in which two flows both create.
            const response = await airtableRequest<{ records: RawAirtableRecord[] }>(
                apiToken,
                tablePath(baseId, tableId),
                {
                    method: "PATCH",
                    body: {
                        performUpsert: { fieldsToMergeOn: [key] },
                        records: [{ fields: values }],
                        typecast: optionalBoolean(typecast, true),
                    },
                }
            );

            return mapRecord(response.records[0]);
        } catch (error) {
            return handleAirtableError(
                error,
                "AIRTABLE_UPSERT_RECORD_FAILED",
                "Failed to create or update the Airtable record."
            );
        }
    }
}
