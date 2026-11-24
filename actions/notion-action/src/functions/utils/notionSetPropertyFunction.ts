import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules";
import type { NotionProperties } from "../../data_types/notionProperties.js";
import {
    buildPropertyValue,
    PROPERTY_TYPE_DESCRIPTION,
    PROPERTY_TYPE_SIGNATURE,
    PROPERTY_VALUE_DESCRIPTION,
    PROPERTY_VALUE_SIGNATURE,
} from "./propertyValue.js";

@Identifier("notionSetProperty")
@Name({ code: "en-US", content: "Set Notion property" })
@Description({ code: "en-US", content: "Add one column value to a properties object. Chain several nodes, each passing on the previous properties, and use the result in Create or Update Notion page." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Set Notion property ${name}" })
@Signature(`(name: string, type: ${PROPERTY_TYPE_SIGNATURE}, value: ${PROPERTY_VALUE_SIGNATURE}, properties?: NOTION_PROPERTIES): NOTION_PROPERTIES`)
@Parameter({ runtimeName: "name", name: [{ code: "en-US", content: "Column name" }], description: [{ code: "en-US", content: "Exact name of the database column, e.g. Name, Status or Due" }] })
@Parameter({ runtimeName: "type", name: [{ code: "en-US", content: "Property type" }], description: [{ code: "en-US", content: PROPERTY_TYPE_DESCRIPTION }] })
@Parameter({ runtimeName: "value", name: [{ code: "en-US", content: "Property value" }], description: [{ code: "en-US", content: PROPERTY_VALUE_DESCRIPTION }] })
@Parameter({ runtimeName: "properties", name: [{ code: "en-US", content: "Properties" }], description: [{ code: "en-US", content: "Properties of a previous Set Notion property node to extend. Leave empty to start a new object." }], optional: true })
export class NotionSetPropertyFunction {
    run(_context: unknown, name: string, type: string, value: unknown, properties?: NotionProperties | null): NotionProperties {
        if (typeof name !== "string" || !name.trim()) throw new RuntimeError("NOTION_INVALID_PROPERTY_NAME", "A column name is required.");
        // A new object, so the properties of the previous node stay unchanged.
        return { ...(properties ?? {}), [name]: buildPropertyValue(type, value) };
    }
}
