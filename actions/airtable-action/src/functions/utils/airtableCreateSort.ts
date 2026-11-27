import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { requireId } from "../../client.js";
import { normalizeDirection } from "../../helpers.js";
import { AirtableSortType } from "../../data_types/airtableSort.js";

@Identifier("airtableCreateSort")
@Signature("(field: string, direction?: string): AIRTABLE_SORT")
@Name({ code: "en-US", content: "Create Airtable sort" })
@DisplayIcon("simple:airtable")
@DisplayMessage({ code: "en-US", content: "Sort by ${field}" })
@Documentation({ code: "en-US", content: "Creates a sort (`AIRTABLE_SORT`) for `airtableListRecords`." })
@Description({ code: "en-US", content: "Create a sort for listing records." })
@Parameter({
    runtimeName: "field",
    name: [{ code: "en-US", content: "Field" }],
    description: [{ code: "en-US", content: "The name of the field to sort by." }],
})
@Parameter({
    runtimeName: "direction",
    name: [{ code: "en-US", content: "Direction" }],
    description: [{ code: "en-US", content: '"asc" or "desc". Empty sorts ascending.' }],
    optional: true,
})
export class AirtableCreateSortFunction {
    run(_context: unknown, field: string, direction?: string): AirtableSortType {
        return { field: requireId(field, "field"), direction: normalizeDirection(direction) };
    }
}
