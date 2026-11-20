import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import { NotionPropertyValue } from "../../data_types/notionPropertyValue.js";

export type NotionPropertyType =
    | "title"
    | "rich_text"
    | "number"
    | "checkbox"
    | "select"
    | "status"
    | "url"
    | "email"
    | "phone_number"
    | "date";

/**
 * Builds the nested Notion property value shape for a given property type from
 * a single string value. Centralised here so it can be unit tested.
 * See https://developers.notion.com/reference/page-property-values
 */
export function buildPropertyValue(type: NotionPropertyType, value: string): NotionPropertyValue {
    switch (type) {
        case "title":
        case "rich_text":
            return { [type]: [{ type: "text", text: { content: value } }] };
        case "number":
            return { number: value === "" ? null : Number(value) };
        case "checkbox":
            return { checkbox: value === "true" };
        case "select":
        case "status":
            return { [type]: { name: value } };
        case "date":
            return { date: { start: value } };
        case "url":
        case "email":
        case "phone_number":
            return { [type]: value };
    }
}

@Identifier("notionCreatePropertyValue")
@DisplayIcon("tabler:adjustments")
@Signature(
    '(Type: "title"|"rich_text"|"number"|"checkbox"|"select"|"status"|"url"|"email"|"phone_number"|"date", Value: string): NOTION_PROPERTY_VALUE'
)
@Name({ code: "en-US", content: "Create property value" })
@DisplayMessage({ code: "en-US", content: "Create Notion ${Type} property value" })
@Documentation({
    code: "en-US",
    content:
        "Builds a Notion property value (`NOTION_PROPERTY_VALUE`) of the given type from a single string value, producing the nested shape Notion expects. Combine several into a map keyed by property name for `notionCreatePage` / `notionUpdatePage`.\nFor `number` the value is parsed as a number, for `checkbox` the string `\"true\"` means checked, and for `date` the value is used as the start date.",
})
@Description({ code: "en-US", content: "Builds a Notion property value of a given type." })
@Parameter({
    runtimeName: "Type",
    name: [{ code: "en-US", content: "Type" }],
    description: [{ code: "en-US", content: "The Notion property type to build." }],
})
@Parameter({
    runtimeName: "Value",
    name: [{ code: "en-US", content: "Value" }],
    description: [{ code: "en-US", content: "The value, as a string, to wrap in the property shape." }],
})
export class CreatePropertyValueFunction {
    run(_context: unknown, Type: NotionPropertyType, Value: string): NotionPropertyValue {
        return buildPropertyValue(Type, Value);
    }
}
