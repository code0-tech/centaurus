import { RuntimeError } from "@code0-tech/hercules";
import { z } from "zod";
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

/** A single text or a list of texts; a single text becomes a one-item list. */
const textList = z.union([z.string(), z.array(z.string())]).nullable().transform((value) => value == null ? [] : Array.isArray(value) ? value : [value]);
const text = z.string().max(2000).nullable();

/**
 * How a plain flow value becomes the Notion value of a column type. Each entry
 * parses the flow value and returns the nested value Notion expects under the
 * type key, e.g. "High" for a select column becomes { name: "High" }.
 */
const converters: Record<string, z.ZodType<unknown>> = {
    title: text.transform((value) => value ? [{ type: "text", text: { content: value } }] : []),
    rich_text: text.transform((value) => value ? [{ type: "text", text: { content: value } }] : []),
    number: z.number().nullable(),
    checkbox: z.boolean(),
    select: z.string().nullable().transform((value) => value ? { name: value } : null),
    status: z.string().nullable().transform((value) => value ? { name: value } : null),
    multi_select: textList.transform((names) => names.map((name) => ({ name }))),
    date: z.union([dateInput, z.object({ start: dateInput, end: dateInput.nullish() })]).nullable()
        .transform((value) => value == null ? null : typeof value === "string" ? { start: value } : { start: value.start, ...(value.end != null ? { end: value.end } : {}) }),
    url: z.string().nullable().transform((value) => value || null),
    email: z.string().nullable().transform((value) => value || null),
    phone_number: z.string().nullable().transform((value) => value || null),
    people: textList.transform((ids) => ids.map((id) => ({ id }))),
    relation: textList.transform((ids) => ids.map((id) => ({ id }))),
};

export const WRITABLE_PROPERTY_TYPES = Object.keys(converters);

/** What each column type accepts, for error messages. */
const EXPECTED: Record<string, string> = {
    title: "text", rich_text: "text", number: "a number", checkbox: "true or false", select: "an option name",
    status: "a status name", multi_select: "an option name or a list of names", date: "a DATE, ISO date text or { start, end }",
    url: "text", email: "text", phone_number: "text", people: "a user ID or a list of user IDs", relation: "a page ID or a list of page IDs",
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Converts plain column values ({ "Name": "Task", "Done": true }) into Notion
 * property values, using the column types of the database or page. A value
 * that is already in Notion's shape ({ "select": { "name": "High" } }) is kept.
 * null (or an empty text or list) clears the column.
 */
export function toNotionProperties(values: unknown, columnTypes: Record<string, string>): Record<string, NotionPropertyValue> {
    if (!isPlainObject(values)) {
        throw new RuntimeError("NOTION_INVALID_PROPERTIES", "Properties must be an object of column names and values, e.g. { \"Name\": \"Task\", \"Done\": true }.");
    }
    const result: Record<string, NotionPropertyValue> = {};
    for (const [name, value] of Object.entries(values)) {
        const type = Object.hasOwn(columnTypes, name) ? columnTypes[name] : undefined;
        if (!type) {
            throw new RuntimeError("NOTION_UNKNOWN_PROPERTY", `The database has no column named "${name}". Columns: ${Object.keys(columnTypes).join(", ")}.`);
        }
        const converter = Object.hasOwn(converters, type) ? converters[type] : undefined;
        if (!converter) {
            throw new RuntimeError("NOTION_READ_ONLY_PROPERTY", `The column "${name}" has the type ${type}, which cannot be written.`);
        }
        const nested = isPlainObject(value) && Object.hasOwn(value, type)
            ? { success: true as const, data: value[type] }
            : converter.safeParse(value ?? null);
        const parsed = nested.success ? NotionPropertyValueSchema.safeParse({ [type]: nested.data }) : undefined;
        if (!parsed?.success) {
            throw new RuntimeError("NOTION_INVALID_PROPERTY_VALUE", `Invalid value for the ${type} column "${name}": expected ${EXPECTED[type]}.`);
        }
        result[name] = parsed.data;
    }
    return result;
}
