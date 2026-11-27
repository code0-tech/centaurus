import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { airtableRequest, recordPath } from "../../client.js";
import { handleAirtableError, mapRecord, RawAirtableRecord } from "../../helpers.js";
import { AirtableRecordType } from "../../data_types/airtableRecord.js";
import { API_TOKEN_PARAMETER, BASE_ID_PARAMETER, RECORD_ID_PARAMETER, TABLE_ID_PARAMETER } from "../parameters.js";

@Identifier("airtableGetRecord")
@Signature("(apiToken: string, baseId: string, tableId: string, recordId: string): AIRTABLE_RECORD")
@Name({ code: "en-US", content: "Get record" })
@DisplayIcon("simple:airtable")
@DisplayMessage({ code: "en-US", content: "Get record ${recordId}" })
@Documentation({ code: "en-US", content: "Reads one record of an Airtable table by its ID." })
@Description({ code: "en-US", content: "Read a record by its ID." })
@Parameter(API_TOKEN_PARAMETER)
@Parameter(BASE_ID_PARAMETER)
@Parameter(TABLE_ID_PARAMETER)
@Parameter(RECORD_ID_PARAMETER)
export class AirtableGetRecordFunction {
    async run(
        _context: unknown,
        apiToken: string,
        baseId: string,
        tableId: string,
        recordId: string
    ): Promise<AirtableRecordType> {
        try {
            return mapRecord(await airtableRequest<RawAirtableRecord>(apiToken, recordPath(baseId, tableId, recordId)));
        } catch (error) {
            return handleAirtableError(error, "AIRTABLE_GET_RECORD_FAILED", "Failed to read the Airtable record.");
        }
    }
}
