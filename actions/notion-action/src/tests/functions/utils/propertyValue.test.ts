import { describe, expect, it } from "vitest";
import { toNotionProperties } from "../../../functions/utils/propertyValue.js";
import { NotionPropertyValueSchema } from "../../../data_types/notionPropertyValue.js";

const columns: Record<string, string> = {
    Name: "title", Notes: "rich_text", Count: "number", Done: "checkbox", Priority: "select", Status: "status",
    Tags: "multi_select", Due: "date", Link: "url", Mail: "email", Phone: "phone_number", Owner: "people",
    Related: "relation", Total: "formula",
};

const convert = (name: string, value: unknown) => toNotionProperties({ [name]: value }, columns)[name];

describe("Notion property conversion", () => {
    it("converts plain values by column type", () => {
        expect(toNotionProperties({ Name: "Task", Done: true, Priority: "High" }, columns)).toEqual({
            Name: { title: [{ type: "text", text: { content: "Task" } }] },
            Done: { checkbox: true },
            Priority: { select: { name: "High" } },
        });
    });

    it.each<[string, unknown, unknown]>([
        ["Name", "Task", { title: [{ type: "text", text: { content: "Task" } }] }],
        ["Notes", "Notes", { rich_text: [{ type: "text", text: { content: "Notes" } }] }],
        ["Count", 0, { number: 0 }],
        ["Done", false, { checkbox: false }],
        ["Priority", "High", { select: { name: "High" } }],
        ["Status", "Done", { status: { name: "Done" } }],
        ["Tags", ["A", "B"], { multi_select: [{ name: "A" }, { name: "B" }] }],
        ["Tags", "A", { multi_select: [{ name: "A" }] }],
        ["Due", "2026-09-14", { date: { start: "2026-09-14" } }],
        ["Due", { start: "2026-09-14", end: "2026-09-15" }, { date: { start: "2026-09-14", end: "2026-09-15" } }],
        // DATE values (Unix microseconds), e.g. a page timestamp or std::date::now.
        ["Due", 1788256800000000, { date: { start: "2026-09-01T10:00:00.000Z" } }],
        ["Due", { start: 1788256800000000, end: "2026-09-02" }, { date: { start: "2026-09-01T10:00:00.000Z", end: "2026-09-02" } }],
        ["Owner", ["user-1"], { people: [{ id: "user-1" }] }],
        ["Related", "page-1", { relation: [{ id: "page-1" }] }],
        ["Link", "https://example.com", { url: "https://example.com" }],
        ["Mail", "test@example.com", { email: "test@example.com" }],
        ["Phone", "+49123", { phone_number: "+49123" }],
        // null and empty values clear the column.
        ["Name", null, { title: [] }],
        ["Priority", null, { select: null }],
        ["Count", null, { number: null }],
        ["Due", null, { date: null }],
        ["Link", "", { url: null }],
        ["Related", [], { relation: [] }],
    ])("converts %s = %j", (name, value, expected) => {
        const result = convert(name, value);
        expect(result).toEqual(expected);
        expect(NotionPropertyValueSchema.parse(result)).toEqual(expected);
    });

    it("keeps values that are already in Notion's shape", () => {
        const title = { title: [{ type: "text", text: { content: "Task", link: { url: "https://example.com" } }, annotations: { bold: true } }] };
        expect(convert("Name", title)).toEqual(title);
        expect(convert("Priority", { select: { name: "High" } })).toEqual({ select: { name: "High" } });
    });

    it.each<[string, unknown]>([["Done", "yes"], ["Count", "123"], ["Tags", 1], ["Related", [1]], ["Name", "x".repeat(2001)]])("rejects %s = %j", (name, value) => {
        expect(() => convert(name, value)).toThrow(expect.objectContaining({ code: "NOTION_INVALID_PROPERTY_VALUE" }));
    });

    it("rejects unknown and read-only columns and non-object input", () => {
        expect(() => convert("Missing", "x")).toThrow(expect.objectContaining({ code: "NOTION_UNKNOWN_PROPERTY" }));
        expect(() => convert("__proto__", "x")).toThrow(expect.objectContaining({ code: "NOTION_UNKNOWN_PROPERTY" }));
        expect(() => convert("Total", 5)).toThrow(expect.objectContaining({ code: "NOTION_READ_ONLY_PROPERTY" }));
        expect(() => toNotionProperties("Name", columns)).toThrow(expect.objectContaining({ code: "NOTION_INVALID_PROPERTIES" }));
        expect(() => toNotionProperties(["Name"], columns)).toThrow(expect.objectContaining({ code: "NOTION_INVALID_PROPERTIES" }));
    });
});
