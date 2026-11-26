import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { airtableRequest, recordPath } from "../../client.js";
import { handleAirtableError } from "../../helpers.js";
import { API_TOKEN_PARAMETER, BASE_ID_PARAMETER, RECORD_ID_PARAMETER, TABLE_ID_PARAMETER } from "../parameters.js";

@Identifier("airtableDeleteRecord")
@Signature("(apiToken: string, baseId: string, tableId: string, recordId: string): boolean")
@Name({ code: "en-US", content: "Delete record" })
@DisplayIcon("simple:airtable")
@DisplayMessage({ code: "en-US", content: "Delete record ${recordId}" })
@Documentation({ code: "en-US", content: "Deletes a record and returns whether Airtable deleted it." })
@Description({ code: "en-US", content: "Delete a record." })
@Parameter(API_TOKEN_PARAMETER)
@Parameter(BASE_ID_PARAMETER)
@Parameter(TABLE_ID_PARAMETER)
@Parameter(RECORD_ID_PARAMETER)
export class AirtableDeleteRecordFunction {
    async run(
        _context: unknown,
        apiToken: string,
        baseId: string,
        tableId: string,
        recordId: string
    ): Promise<boolean> {
        try {
            const response = await airtableRequest<{ id: string; deleted: boolean }>(
                apiToken,
                recordPath(baseId, tableId, recordId),
                { method: "DELETE" }
            );

            return response?.deleted === true;
        } catch (error) {
            return handleAirtableError(error, "AIRTABLE_DELETE_RECORD_FAILED", "Failed to delete the Airtable record.");
        }
    }
}
