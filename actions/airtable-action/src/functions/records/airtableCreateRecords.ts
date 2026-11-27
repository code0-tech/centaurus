import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { airtableRequest, tablePath } from "../../client.js";
import {
    chunk,
    handleAirtableError,
    mapRecord,
    MAX_RECORDS_PER_WRITE,
    optionalBoolean,
    parseFieldMapList,
    RawAirtableRecord,
} from "../../helpers.js";
import { AirtableFieldMapType } from "../../data_types/airtableFieldMap.js";
import { AirtableRecordListType } from "../../data_types/airtableRecordList.js";
import { API_TOKEN_PARAMETER, BASE_ID_PARAMETER, TABLE_ID_PARAMETER, TYPECAST_PARAMETER } from "../parameters.js";

@Identifier("airtableCreateRecords")
@Signature("(apiToken: string, baseId: string, tableId: string, records: AIRTABLE_FIELD_MAP[], typecast?: boolean): AIRTABLE_RECORD_LIST")
@Name({ code: "en-US", content: "Create records" })
@DisplayIcon("simple:airtable")
@DisplayMessage({ code: "en-US", content: "Create records in ${tableId}" })
@Documentation({
    code: "en-US",
    content:
        "Creates several records in an Airtable table. Airtable takes 10 records per request, so longer lists are sent in batches of 10. A failing batch stops the call; earlier batches stay created.",
})
@Description({ code: "en-US", content: "Create several records in a table." })
@Parameter(API_TOKEN_PARAMETER)
@Parameter(BASE_ID_PARAMETER)
@Parameter(TABLE_ID_PARAMETER)
@Parameter({
    runtimeName: "records",
    name: [{ code: "en-US", content: "Records" }],
    description: [{ code: "en-US", content: "The fields of every record to create, as a list or a JSON array string." }],
})
@Parameter(TYPECAST_PARAMETER)
export class AirtableCreateRecordsFunction {
    async run(
        _context: unknown,
        apiToken: string,
        baseId: string,
        tableId: string,
        records: AirtableFieldMapType[] | string,
        typecast?: boolean
    ): Promise<AirtableRecordListType> {
        try {
            const path = tablePath(baseId, tableId);
            const created: AirtableRecordListType["records"] = [];

            for (const batch of chunk(parseFieldMapList(records), MAX_RECORDS_PER_WRITE)) {
                const response = await airtableRequest<{ records: RawAirtableRecord[] }>(apiToken, path, {
                    method: "POST",
                    body: {
                        records: batch.map((fields) => ({ fields })),
                        typecast: optionalBoolean(typecast, true),
                    },
                });
                created.push(...response.records.map(mapRecord));
            }

            return { records: created };
        } catch (error) {
            return handleAirtableError(error, "AIRTABLE_CREATE_RECORDS_FAILED", "Failed to create the Airtable records.");
        }
    }
}
