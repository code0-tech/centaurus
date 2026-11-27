import { describe, expect, it } from "vitest";
import { buildPropertyValue, type PropertyInput } from "../../../functions/utils/propertyValue.js";
import { NotionPropertyValueSchema } from "../../../data_types/notionPropertyValue.js";
import { NotionSetPropertyFunction } from "../../../functions/utils/notionSetPropertyFunction.js";

describe("Notion property builder", () => {
    const setProperty = new NotionSetPropertyFunction();

    it("chains column values into one properties object", () => {
        const first = setProperty.run(null, "Name", "title", "Task");
        expect(first).toEqual({ Name: { title: [{ type: "text", text: { content: "Task" } }] } });
        const second = setProperty.run(null, "Priority", "select", "High", null, null, null, null, null, first);
        expect(second).toEqual({ ...first, Priority: { select: { name: "High" } } });
        // The previous node's properties stay unchanged.
        expect(first).not.toHaveProperty("Priority");
        expect(setProperty.run(null, "Priority", "select", "Low", null, null, null, null, null, second).Priority).toEqual({ select: { name: "Low" } });
    });

    it("reads the parameter that matches the property type", () => {
        expect(setProperty.run(null, "Done", "checkbox", "ignored", 3, true)).toEqual({ Done: { checkbox: true } });
        expect(setProperty.run(null, "Count", "number", "ignored", 3)).toEqual({ Count: { number: 3 } });
        expect(setProperty.run(null, "Tags", "multi_select", null, null, null, null, null, ["A", "B"])).toEqual({ Tags: { multi_select: [{ name: "A" }, { name: "B" }] } });
        expect(setProperty.run(null, "Due", "date", null, null, null, "2026-09-14", "2026-09-15")).toEqual({ Due: { date: { start: "2026-09-14", end: "2026-09-15" } } });
    });

    it("rejects missing column names and invalid values", () => {
        expect(() => setProperty.run(null, " ", "title", "Task")).toThrow(expect.objectContaining({ code: "NOTION_INVALID_PROPERTY_NAME" }));
        expect(() => setProperty.run(null, "Done", "checkbox", null, null, "yes" as unknown as boolean)).toThrow(expect.objectContaining({ code: "NOTION_INVALID_PROPERTY_VALUE" }));
        expect(() => setProperty.run(null, "Formula", "formula", "1")).toThrow(expect.objectContaining({ code: "NOTION_INVALID_PROPERTY_TYPE" }));
        expect(() => setProperty.run(null, "Due", "date", null, null, null, null, "2026-09-15")).toThrow(expect.objectContaining({ code: "NOTION_INVALID_PROPERTY_VALUE" }));
    });

    it.each<[string, PropertyInput, unknown]>([
        ["title", { text: "Task" }, { title: [{ type: "text", text: { content: "Task" } }] }],
        ["rich_text", { text: "Notes" }, { rich_text: [{ type: "text", text: { content: "Notes" } }] }],
        ["number", { number: 0 }, { number: 0 }],
        ["checkbox", { checked: false }, { checkbox: false }],
        ["select", { text: "High" }, { select: { name: "High" } }],
        ["status", { text: "Done" }, { status: { name: "Done" } }],
        ["multi_select", { values: ["A", "B"] }, { multi_select: [{ name: "A" }, { name: "B" }] }],
        ["date", { date: "2026-09-14" }, { date: { start: "2026-09-14" } }],
        ["date", { date: "2026-09-14", endDate: "2026-09-15" }, { date: { start: "2026-09-14", end: "2026-09-15" } }],
        // DATE values (Unix microseconds), e.g. a page timestamp or std::date::now.
        ["date", { date: 1788256800000000 }, { date: { start: "2026-09-01T10:00:00.000Z" } }],
        ["date", { date: 1788256800000000, endDate: "2026-09-02" }, { date: { start: "2026-09-01T10:00:00.000Z", end: "2026-09-02" } }],
        ["people", { values: ["user-1"] }, { people: [{ id: "user-1" }] }],
        ["relation", { values: ["page-1"] }, { relation: [{ id: "page-1" }] }],
        ["url", { text: "https://example.com" }, { url: "https://example.com" }],
        ["email", { text: "test@example.com" }, { email: "test@example.com" }],
        ["phone_number", { text: "+49123" }, { phone_number: "+49123" }],
        // A missing value clears the column.
        ["title", {}, { title: [] }],
        ["select", { text: null }, { select: null }],
        ["number", {}, { number: null }],
        ["checkbox", {}, { checkbox: false }],
        ["date", {}, { date: null }],
        ["url", { text: "" }, { url: null }],
        ["relation", {}, { relation: [] }],
    ])("builds %s values from %j", (type, input, expected) => {
        const value = buildPropertyValue(type, input);
        expect(value).toEqual(expected);
        expect(NotionPropertyValueSchema.parse(value)).toEqual(expected);
    });

    it.each<[string, unknown]>([["checkbox", { checked: "false" }], ["number", { number: "123" }], ["multi_select", { values: "one" }], ["relation", { values: [1] }], ["formula", {}], ["__proto__", {}]])("rejects invalid %s values", (type, input) => {
        expect(() => buildPropertyValue(type, input as PropertyInput)).toThrow();
    });

    it("enforces the rich-text item length limit", () => {
        expect(() => buildPropertyValue("title", { text: "x".repeat(2001) })).toThrow();
    });
});
