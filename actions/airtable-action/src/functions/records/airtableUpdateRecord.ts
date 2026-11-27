import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { airtableRequest, recordPath } from "../../client.js";
import { handleAirtableError, mapRecord, optionalBoolean, parseFieldMap, RawAirtableRecord } from "../../helpers.js";
import { AirtableFieldMapType } from "../../data_types/airtableFieldMap.js";
import { AirtableRecordType } from "../../data_types/airtableRecord.js";
import {
    API_TOKEN_PARAMETER,
    BASE_ID_PARAMETER,
    FIELDS_PARAMETER,
    RECORD_ID_PARAMETER,
    TABLE_ID_PARAMETER,
    TYPECAST_PARAMETER,
} from "../parameters.js";

@Identifier("airtableUpdateRecord")
@Signature("(apiToken: string, baseId: string, tableId: string, recordId: string, fields: AIRTABLE_FIELD_MAP, replace?: boolean, typecast?: boolean): AIRTABLE_RECORD")
@Name({ code: "en-US", content: "Update record" })
@DisplayIcon("simple:airtable")
@DisplayMessage({ code: "en-US", content: "Update record ${recordId}" })
@Documentation({
    code: "en-US",
    content:
        "Updates a record. By default only the given fields change; with `replace` every field that is not given is cleared.",
})
@Description({ code: "en-US", content: "Update the fields of a record." })
@Parameter(API_TOKEN_PARAMETER)
@Parameter(BASE_ID_PARAMETER)
@Parameter(TABLE_ID_PARAMETER)
@Parameter(RECORD_ID_PARAMETER)
@Parameter(FIELDS_PARAMETER)
@Parameter({
    runtimeName: "replace",
    name: [{ code: "en-US", content: "Replace" }],
    description: [
        { code: "en-US", content: "Clear every field that is not given instead of keeping it. Empty keeps the other fields." },
    ],
    optional: true,
})
@Parameter(TYPECAST_PARAMETER)
export class AirtableUpdateRecordFunction {
    async run(
        _context: unknown,
        apiToken: string,
        baseId: string,
        tableId: string,
        recordId: string,
        fields: AirtableFieldMapType | string,
        replace?: boolean,
        typecast?: boolean
    ): Promise<AirtableRecordType> {
        try {
            const record = await airtableRequest<RawAirtableRecord>(apiToken, recordPath(baseId, tableId, recordId), {
                // PATCH merges the given fields, PUT replaces the whole record.
                method: optionalBoolean(replace, false) ? "PUT" : "PATCH",
                body: { fields: parseFieldMap(fields), typecast: optionalBoolean(typecast, true) },
            });

            return mapRecord(record);
        } catch (error) {
            return handleAirtableError(error, "AIRTABLE_UPDATE_RECORD_FAILED", "Failed to update the Airtable record.");
        }
    }
}
