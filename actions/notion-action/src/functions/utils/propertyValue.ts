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

/** One flow parameter per kind of value; each property type reads the one it needs. */
const PropertyInputSchema = z.object({
    text: z.string().max(2000).nullish(),
    number: z.number().nullish(),
    checked: z.boolean().nullish(),
    date: dateInput.nullish(),
    endDate: dateInput.nullish(),
    values: z.array(z.string()).nullish(),
});
export type PropertyInput = z.input<typeof PropertyInputSchema>;
type Input = z.output<typeof PropertyInputSchema>;

const text = (input: Input) => input.text ? [{ type: "text", text: { content: input.text } }] : [];
const option = (input: Input) => input.text ? { name: input.text } : null;
const plain = (input: Input) => input.text || null;

const builders = {
    title: text,
    rich_text: text,
    number: (input: Input) => input.number ?? null,
    checkbox: (input: Input) => input.checked ?? false,
    select: option,
    status: option,
    multi_select: (input: Input) => (input.values ?? []).map((name) => ({ name })),
    date: (input: Input) => {
        if (input.date == null) {
            if (input.endDate != null) throw new RuntimeError("NOTION_INVALID_PROPERTY_VALUE", "An end date needs a start date.");
            return null;
        }
        return { start: input.date, ...(input.endDate != null ? { end: input.endDate } : {}) };
    },
    url: plain,
    email: plain,
    phone_number: plain,
    people: (input: Input) => (input.values ?? []).map((id) => ({ id })),
    relation: (input: Input) => (input.values ?? []).map((id) => ({ id })),
} satisfies Record<string, (input: Input) => unknown>;

export const PROPERTY_TYPES = Object.keys(builders) as (keyof typeof builders)[];

/** The writable property types as a signature type, so the flow editor offers them as a selection. */
export const PROPERTY_TYPE_SIGNATURE = PROPERTY_TYPES.map((type) => `"${type}"`).join(" | ");
export const PROPERTY_TYPE_DESCRIPTION = "Type of the database column: title, rich_text, number, checkbox, select, status, multi_select, date, url, email, phone_number, people or relation.";

/**
 * Builds a writable Notion property value from a column type and the flow
 * parameter that belongs to it (used by notionSetProperty). A missing value
 * clears the property (a checkbox becomes unchecked).
 */
export function buildPropertyValue(type: string, input: PropertyInput): NotionPropertyValue {
    if (!Object.hasOwn(builders, type)) throw new RuntimeError("NOTION_INVALID_PROPERTY_TYPE", `Unsupported writable property type: ${type}`);
    const parsed = PropertyInputSchema.safeParse(input);
    if (!parsed.success) throw new RuntimeError("NOTION_INVALID_PROPERTY_VALUE", `Invalid value for Notion property type ${type}.`);
    const result = NotionPropertyValueSchema.safeParse({ [type]: builders[type as keyof typeof builders](parsed.data) });
    if (!result.success) throw new RuntimeError("NOTION_INVALID_PROPERTY_VALUE", `Invalid value for Notion property type ${type}.`);
    return result.data;
}
