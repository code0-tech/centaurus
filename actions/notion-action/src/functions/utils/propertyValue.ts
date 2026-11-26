import { RuntimeError } from "@code0-tech/hercules";
import { z } from "zod";
import { NotionRichTextSchema } from "../../data_types/notionRichText.js";
import { NotionPropertyValueSchema, type NotionPropertyValue } from "../../data_types/notionPropertyValue.js";

/** A DATE (Unix microseconds) or ISO 8601 text, as Notion expects it: ISO 8601 text. */
const dateInput = z.union([z.string(), z.number()]).transform((value, ctx) => {
    if (typeof value === "string") return value;
    const date = new Date(value / 1000);
    if (!Number.isFinite(value) || Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: "custom", message: "Invalid date" });
        return z.NEVER;
    }
    return date.toISOString();
});

const propertyInputs = {
    title: z.union([z.string().max(2000), z.array(NotionRichTextSchema)]),
    rich_text: z.union([z.string().max(2000), z.array(NotionRichTextSchema)]),
    number: z.number().nullable(),
    checkbox: z.boolean(),
    select: z.string().nullable(),
    status: z.string().nullable(),
    multi_select: z.array(z.string()),
    date: z.union([dateInput, z.object({ start: dateInput, end: dateInput.nullable().optional(), time_zone: z.string().nullable().optional() })]).nullable(),
    url: z.string().nullable(),
    email: z.string().nullable(),
    phone_number: z.string().nullable(),
    people: z.array(z.string()),
    relation: z.array(z.string()),
};

export const PROPERTY_TYPES = Object.keys(propertyInputs) as (keyof typeof propertyInputs)[];

/** The writable property types as a signature type, so the flow editor offers them as a selection. */
export const PROPERTY_TYPE_SIGNATURE = PROPERTY_TYPES.map((type) => `"${type}"`).join(" | ");
export const PROPERTY_VALUE_SIGNATURE = "string | number | boolean | DATE | string[] | NOTION_RICH_TEXT[] | { start: DATE | string; end?: DATE | string; time_zone?: string } | null";

export const PROPERTY_TYPE_DESCRIPTION = "Type of the database column: title, rich_text, number, checkbox, select, status, multi_select, date, url, email, phone_number, people or relation.";
export const PROPERTY_VALUE_DESCRIPTION = "Text for title/rich_text/select/status/url/email/phone_number, a number or boolean for number/checkbox, names for multi_select, user or page IDs for people/relation, a DATE, ISO date text or { start, end?, time_zone? } for date. null clears nullable properties.";

/** Builds a writable Notion property value from a column type and a flow value (used by notionSetProperty). */
export function buildPropertyValue(type: string, value: unknown): NotionPropertyValue {
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
