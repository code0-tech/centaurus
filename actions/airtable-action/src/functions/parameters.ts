/**
 * The parameters most Airtable functions share. Every function starts with the
 * personal access token it works with, followed by the base and table.
 */
export const API_TOKEN_PARAMETER = {
    runtimeName: "apiToken",
    name: [{ code: "en-US", content: "Personal access token" }],
    description: [
        {
            code: "en-US",
            content:
                "An Airtable personal access token with access to the base (scopes data.records:read and data.records:write).",
        },
    ],
};

export const BASE_ID_PARAMETER = {
    runtimeName: "baseId",
    name: [{ code: "en-US", content: "Base ID" }],
    description: [{ code: "en-US", content: "The ID of the base, starts with `app`." }],
};

export const TABLE_ID_PARAMETER = {
    runtimeName: "tableId",
    name: [{ code: "en-US", content: "Table" }],
    description: [{ code: "en-US", content: "The ID (starts with `tbl`) or the name of the table." }],
};

export const RECORD_ID_PARAMETER = {
    runtimeName: "recordId",
    name: [{ code: "en-US", content: "Record ID" }],
    description: [{ code: "en-US", content: "The ID of the record, starts with `rec`." }],
};

export const FIELDS_PARAMETER = {
    runtimeName: "fields",
    name: [{ code: "en-US", content: "Fields" }],
    description: [
        { code: "en-US", content: "The cell values by field name, as an object or a JSON object string." },
    ],
};

export const TYPECAST_PARAMETER = {
    runtimeName: "typecast",
    name: [{ code: "en-US", content: "Convert values" }],
    description: [
        {
            code: "en-US",
            content:
                "Let Airtable convert the values to the field types, e.g. text to a number or a new select option. Empty converts.",
        },
    ],
    optional: true,
};
