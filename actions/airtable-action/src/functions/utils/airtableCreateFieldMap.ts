import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { requireId } from "../../client.js";
import { parseFieldMap } from "../../helpers.js";
import { AirtableFieldMapType } from "../../data_types/airtableFieldMap.js";

@Identifier("airtableCreateFieldMap")
@Signature("(field: string, value: any, fields?: AIRTABLE_FIELD_MAP): AIRTABLE_FIELD_MAP")
@Name({ code: "en-US", content: "Set Airtable field" })
@DisplayIcon("simple:airtable")
@DisplayMessage({ code: "en-US", content: "Set field ${field}" })
@Documentation({
    code: "en-US",
    content:
        "Builds the fields for creating or updating a record. Returns `fields` with the field set to the value, or a new map with only that field - chain calls to set several fields.",
})
@Description({ code: "en-US", content: "Set a field in an Airtable field map." })
@Parameter({
    runtimeName: "field",
    name: [{ code: "en-US", content: "Field" }],
    description: [{ code: "en-US", content: "The name of the field." }],
})
@Parameter({
    runtimeName: "value",
    name: [{ code: "en-US", content: "Value" }],
    description: [
        {
            code: "en-US",
            content: "The cell value: text, a number, a boolean, a list of record IDs or a list of attachments.",
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
        return { ...base, [requireId(field, "field")]: value ?? null };
    }
}
