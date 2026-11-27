import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { airtableRequest, requireId } from "../../client.js";
import { handleAirtableError } from "../../helpers.js";
import { AirtableTableType } from "../../data_types/airtableTable.js";
import { API_TOKEN_PARAMETER, BASE_ID_PARAMETER } from "../parameters.js";

interface RawTable {
    id: string;
    name: string;
    description?: string;
    primaryFieldId: string;
    fields?: { id: string; name: string; type: string; description?: string; options?: Record<string, unknown> }[];
    views?: { id: string; name: string; type: string }[];
}

@Identifier("airtableGetTables")
@Signature("(apiToken: string, baseId: string): AIRTABLE_TABLE[]")
@Name({ code: "en-US", content: "Get tables" })
@DisplayIcon("simple:airtable")
@DisplayMessage({ code: "en-US", content: "Get tables of ${baseId}" })
@Documentation({
    code: "en-US",
    content: "Reads the tables of a base with their fields and views. Needs the `schema.bases:read` scope.",
})
@Description({ code: "en-US", content: "Read the tables, fields and views of a base." })
@Parameter(API_TOKEN_PARAMETER)
@Parameter(BASE_ID_PARAMETER)
export class AirtableGetTablesFunction {
    async run(_context: unknown, apiToken: string, baseId: string): Promise<AirtableTableType[]> {
        try {
            const response = await airtableRequest<{ tables: RawTable[] }>(
                apiToken,
                `/meta/bases/${encodeURIComponent(requireId(baseId, "base id"))}/tables`
            );

            return (response.tables ?? []).map(mapTable);
        } catch (error) {
            return handleAirtableError(error, "AIRTABLE_GET_TABLES_FAILED", "Failed to read the Airtable tables.");
        }
    }
}

export function mapTable(table: RawTable): AirtableTableType {
    return {
        id: table.id,
        name: table.name,
        description: table.description ?? null,
        primaryFieldId: table.primaryFieldId,
        fields: (table.fields ?? []).map((field) => ({
            id: field.id,
            name: field.name,
            type: field.type,
            description: field.description ?? null,
            options: field.options ?? null,
        })),
        views: (table.views ?? []).map((view) => ({ id: view.id, name: view.name, type: view.type })),
    };
}
