import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { requireId } from "../../client.js";
import { parseFieldMap } from "../../helpers.js";
import { AirtableFieldMapType } from "../../data_types/airtableFieldMap.js";

@Identifier("airtableCreateFieldMap")
@Signature("(field: string, value: string, fields?: AIRTABLE_FIELD_MAP): AIRTABLE_FIELD_MAP")
@Name({ code: "en-US", content: "Set Airtable field" })
@DisplayIcon("simple:airtable")
@DisplayMessage({ code: "en-US", content: "Set field ${field}" })
@Documentation({
    code: "en-US",
    content:
        "Builds the fields for creating or updating a record. Returns `fields` with the field set to the value, or a new map with only that field - chain calls to set several fields. The value is text; Airtable converts it to the field type when the record function converts values (the default). For list fields - linked records, multiple selects, attachments - give a JSON list, e.g. `[\"recAbc123\"]`.",
})
@Description({ code: "en-US", content: "Set a field in an Airtable field map." })
@Parameter({
    runtimeName: "field",
    name: [{ code: "en-US", content: "Field" }],
    description: [{ code: "en-US", content: "The name or ID (starts with `fld`) of the field." }],
})
@Parameter({
    runtimeName: "value",
    name: [{ code: "en-US", content: "Value" }],
    description: [
        {
            code: "en-US",
            content:
                'The cell value, e.g. `Completed`, `0.5` or `2024-12-31`. A JSON list such as `["recAbc123"]` sets a list field.',
        },
    ],
})
@Parameter({
    runtimeName: "fields",
    name: [{ code: "en-US", content: "Fields" }],
    description: [{ code: "en-US", content: "The field map to extend. Empty starts a new one." }],
    optional: true,
})
export class AirtableCreateFieldMapFunction {
    run(_context: unknown, field: string, value: unknown, fields?: AirtableFieldMapType | string): AirtableFieldMapType {
        const base = fields === undefined || fields === null || fields === "" ? {} : parseFieldMap(fields);
        return { ...base, [requireId(field, "field")]: cellValue(value) };
    }
}

/**
 * The value arrives as text. A JSON list becomes a list, so linked records,
 * multiple selects and attachments can be set; everything else stays text and
 * is converted by Airtable's typecast. Non-text values pass through unchanged.
 */
export function cellValue(value: unknown): unknown {
    if (value === undefined || value === null) return null;
    if (typeof value !== "string") return value;

    const trimmed = value.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
            return JSON.parse(trimmed);
        } catch {
            // Not JSON after all - keep it as text.
        }
    }
    return value;
}
