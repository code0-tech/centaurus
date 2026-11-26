import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { airtableRequest, tablePath } from "../../client.js";
import { handleAirtableError, mapRecord, optionalBoolean, parseFieldMap, RawAirtableRecord } from "../../helpers.js";
import { AirtableFieldMapType } from "../../data_types/airtableFieldMap.js";
import { AirtableRecordType } from "../../data_types/airtableRecord.js";
import { API_TOKEN_PARAMETER, BASE_ID_PARAMETER, FIELDS_PARAMETER, TABLE_ID_PARAMETER, TYPECAST_PARAMETER } from "../parameters.js";

@Identifier("airtableCreateRecord")
@Signature("(apiToken: string, baseId: string, tableId: string, fields: AIRTABLE_FIELD_MAP, typecast?: boolean): AIRTABLE_RECORD")
@Name({ code: "en-US", content: "Create record" })
@DisplayIcon("simple:airtable")
@DisplayMessage({ code: "en-US", content: "Create record in ${tableId}" })
@Documentation({ code: "en-US", content: "Creates one record in an Airtable table and returns it." })
@Description({ code: "en-US", content: "Create a record in a table." })
@Parameter(API_TOKEN_PARAMETER)
@Parameter(BASE_ID_PARAMETER)
@Parameter(TABLE_ID_PARAMETER)
@Parameter(FIELDS_PARAMETER)
@Parameter(TYPECAST_PARAMETER)
export class AirtableCreateRecordFunction {
    async run(
        _context: unknown,
        apiToken: string,
        baseId: string,
        tableId: string,
        fields: AirtableFieldMapType | string,
        typecast?: boolean
    ): Promise<AirtableRecordType> {
        try {
            const record = await airtableRequest<RawAirtableRecord>(apiToken, tablePath(baseId, tableId), {
                method: "POST",
                body: { fields: parseFieldMap(fields), typecast: optionalBoolean(typecast, true) },
            });

            return mapRecord(record);
        } catch (error) {
            return handleAirtableError(error, "AIRTABLE_CREATE_RECORD_FAILED", "Failed to create the Airtable record.");
        }
    }
}
