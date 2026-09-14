import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules";
import { z } from "zod";
import { NotionRichTextSchema } from "../../data_types/notionRichText.js";
import { NotionPropertyValueSchema, type NotionPropertyValue } from "../../data_types/notionPropertyValue.js";

const propertyInputs = {
    title: z.union([z.string().max(2000), z.array(NotionRichTextSchema)]),
    rich_text: z.union([z.string().max(2000), z.array(NotionRichTextSchema)]),
    number: z.number().nullable(),
    checkbox: z.boolean(),
    select: z.string().nullable(),
    status: z.string().nullable(),
    multi_select: z.array(z.string()),
    date: z.union([z.string(), z.object({ start: z.string(), end: z.string().nullable().optional(), time_zone: z.string().nullable().optional() })]).nullable(),
    url: z.string().nullable(),
    email: z.string().nullable(),
    phone_number: z.string().nullable(),
    people: z.array(z.string()),
    relation: z.array(z.string()),
};

@Identifier("notionCreatePropertyValue")
@Name({ code: "en-US", content: "Create Notion property value" })
@Description({ code: "en-US", content: "Build a writable property. Text for title/rich_text/select/status; number or boolean for number/checkbox; ID arrays for people/relation; name arrays for multi_select; ISO date text or a date object for date. Nullable properties accept null to clear." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Create Notion ${type} property value" })
@Signature("(type: string, value: string | number | boolean | string[] | NOTION_RICH_TEXT[] | { start: string; end?: string; time_zone?: string } | null): NOTION_PROPERTY_VALUE")
@Parameter({ runtimeName: "type", name: [{ code: "en-US", content: "Property type" }] })
@Parameter({ runtimeName: "value", name: [{ code: "en-US", content: "Property value" }] })
export class NotionCreatePropertyValueFunction {
    run(_context: unknown, type: string, value: unknown): NotionPropertyValue {
        if (!Object.hasOwn(propertyInputs, type)) throw new RuntimeError("NOTION_INVALID_PROPERTY_TYPE", `Unsupported writable property type: ${type}`);
        const parsed = propertyInputs[type as keyof typeof propertyInputs].safeParse(value);
        if (!parsed.success) throw new RuntimeError("NOTION_INVALID_PROPERTY_VALUE", `Invalid value for Notion property type ${type}.`);
        const input = parsed.data;
        let nested: unknown = input;
        if ((type === "title" || type === "rich_text") && typeof input === "string") nested = [{ type: "text", text: { content: input } }];
        if ((type === "select" || type === "status") && input !== null) nested = { name: input };
        if (type === "multi_select") nested = (input as string[]).map((name) => ({ name }));
        if (type === "people" || type === "relation") nested = (input as string[]).map((id) => ({ id }));
        if (type === "date" && typeof input === "string") nested = { start: input };
        const result = NotionPropertyValueSchema.safeParse({ [type]: nested });
        if (!result.success) throw new RuntimeError("NOTION_INVALID_PROPERTY_VALUE", `Invalid value for Notion property type ${type}.`);
        return result.data;
    }
}
