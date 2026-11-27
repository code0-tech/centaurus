import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules";
import type { NotionProperties } from "../../data_types/notionProperties.js";
import { buildPropertyValue, PROPERTY_TYPE_DESCRIPTION, PROPERTY_TYPE_SIGNATURE } from "./propertyValue.js";

const optional = (runtimeName: string, name: string, description: string) =>
    ({ runtimeName, name: [{ code: "en-US", content: name }], description: [{ code: "en-US", content: description }], optional: true });

@Identifier("notionSetProperty")
@Name({ code: "en-US", content: "Set Notion property" })
@Description({ code: "en-US", content: "Add one column value to a properties object. Fill in the value parameter that matches the type; leaving it empty clears the column. Chain several nodes, each passing on the previous properties, and use the result in Create or Update Notion page." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Set Notion property ${name}" })
@Signature(`(name: string, type: ${PROPERTY_TYPE_SIGNATURE}, text?: string, number?: number, checked?: boolean, date?: DATE | string, endDate?: DATE | string, values?: string[], properties?: NOTION_PROPERTIES): NOTION_PROPERTIES`)
@Parameter({ runtimeName: "name", name: [{ code: "en-US", content: "Column name" }], description: [{ code: "en-US", content: "Exact name of the database column, e.g. Name, Status or Due" }] })
@Parameter({ runtimeName: "type", name: [{ code: "en-US", content: "Property type" }], description: [{ code: "en-US", content: PROPERTY_TYPE_DESCRIPTION }] })
@Parameter(optional("text", "Text", "Value of a title, rich_text, select, status, url, email or phone_number column"))
@Parameter(optional("number", "Number", "Value of a number column"))
@Parameter(optional("checked", "Checked", "Value of a checkbox column"))
@Parameter(optional("date", "Date", "Value (or start) of a date column: a DATE or ISO 8601 text such as 2026-09-14"))
@Parameter(optional("endDate", "End date", "End of a date range: a DATE or ISO 8601 text"))
@Parameter(optional("values", "Values", "Option names of a multi_select column, or user/page IDs of a people/relation column"))
@Parameter(optional("properties", "Properties", "Properties of a previous Set Notion property node to extend. Leave empty to start a new object."))
export class NotionSetPropertyFunction {
    run(
        _context: unknown, name: string, type: string, text?: string | null, number?: number | null, checked?: boolean | null,
        date?: number | string | null, endDate?: number | string | null, values?: string[] | null, properties?: NotionProperties | null
    ): NotionProperties {
        if (typeof name !== "string" || !name.trim()) throw new RuntimeError("NOTION_INVALID_PROPERTY_NAME", "A column name is required.");
        // A new object, so the properties of the previous node stay unchanged.
        return { ...(properties ?? {}), [name]: buildPropertyValue(type, { text, number, checked, date, endDate, values }) };
    }
}
