import { describe, expect, it } from "vitest";
import { buildPropertyValue } from "../../../functions/utils/propertyValue.js";
import { NotionPropertyValueSchema } from "../../../data_types/notionPropertyValue.js";
import { NotionCreateBlockFunction } from "../../../functions/utils/notionCreateBlockFunction.js";
import { NotionSetPropertyFunction } from "../../../functions/utils/notionSetPropertyFunction.js";

describe("Notion builders", () => {
    const block = new NotionCreateBlockFunction();
    const setProperty = new NotionSetPropertyFunction();

    it("chains column values into one properties object", () => {
        const first = setProperty.run(null, "Name", "title", "Task", null);
        expect(first).toEqual({ Name: { title: [{ type: "text", text: { content: "Task" } }] } });
        const second = setProperty.run(null, "Priority", "select", "High", first);
        expect(second).toEqual({ ...first, Priority: { select: { name: "High" } } });
        // The previous node's properties stay unchanged.
        expect(first).not.toHaveProperty("Priority");
        expect(setProperty.run(null, "Priority", "select", "Low", second).Priority).toEqual({ select: { name: "Low" } });
    });

    it("rejects missing column names and invalid values", () => {
        expect(() => setProperty.run(null, " ", "title", "Task")).toThrow(expect.objectContaining({ code: "NOTION_INVALID_PROPERTY_NAME" }));
        expect(() => setProperty.run(null, "Done", "checkbox", "yes")).toThrow(expect.objectContaining({ code: "NOTION_INVALID_PROPERTY_VALUE" }));
        expect(() => setProperty.run(null, "Formula", "formula", 1)).toThrow(expect.objectContaining({ code: "NOTION_INVALID_PROPERTY_TYPE" }));
    });

    it("builds text blocks from plain text or rich-text items", () => {
        expect(block.run(null, "paragraph", "Hello")).toEqual({ type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: "Hello" } }] } });
        const text = { type: "text" as const, text: { content: "Bold" }, annotations: { bold: true } };
        expect(block.run(null, "heading_2", [text])).toEqual({ type: "heading_2", heading_2: { rich_text: [text] } });
        expect(block.run(null, "bulleted_list_item", null)).toEqual({ type: "bulleted_list_item", bulleted_list_item: { rich_text: [] } });
    });

    it("builds to_do, code and divider blocks", () => {
        expect(block.run(null, "to_do", "Ship", true)).toEqual({ type: "to_do", to_do: { rich_text: [{ type: "text", text: { content: "Ship" } }], checked: true } });
        expect(block.run(null, "to_do", "Ship", null)).toMatchObject({ to_do: { checked: false } });
        expect(block.run(null, "code", "{}", null, "json")).toMatchObject({ code: { language: "json" } });
        expect(block.run(null, "code", "x", null, null)).toMatchObject({ code: { language: "plain text" } });
        expect(block.run(null, "divider", "ignored")).toEqual({ type: "divider", divider: {} });
    });

    it("rejects unsupported block types, languages and text", () => {
        expect(() => block.run(null, "image", "x")).toThrow(expect.objectContaining({ code: "NOTION_INVALID_BLOCK_TYPE" }));
        expect(() => block.run(null, "code", "x", null, "klingon")).toThrow(expect.objectContaining({ code: "NOTION_INVALID_BLOCK" }));
        expect(() => block.run(null, "paragraph", "x".repeat(2001))).toThrow(expect.objectContaining({ code: "NOTION_INVALID_BLOCK_TEXT" }));
    });

    it("links and formats the whole plain text of a block", () => {
        expect(block.run(null, "paragraph", "Docs", null, null, "https://example.com", true, true)).toEqual({
            type: "paragraph",
            paragraph: { rich_text: [{ type: "text", text: { content: "Docs", link: { url: "https://example.com" } }, annotations: { bold: true, italic: true } }] },
        });
        expect(block.run(null, "quote", "Note", null, null, null, null, true)).toEqual({
            type: "quote", quote: { rich_text: [{ type: "text", text: { content: "Note" }, annotations: { bold: false, italic: true } }] },
        });
        // Code blocks ignore formatting; rich-text items keep their own.
        expect(block.run(null, "code", "x", null, "json", "https://example.com", true)).toEqual({
            type: "code", code: { rich_text: [{ type: "text", text: { content: "x" } }], language: "json" },
        });
        const item = { type: "text" as const, text: { content: "Own" } };
        expect(block.run(null, "paragraph", [item], null, null, "https://example.com", true)).toEqual({ type: "paragraph", paragraph: { rich_text: [item] } });
    });

    it("treats null optional arguments from a flow as unset", () => {
        expect(block.run(null, "paragraph", "Plain", null, null, null, null, null)).toEqual({ type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: "Plain" } }] } });
    });

    it("accepts formatted rich-text items as a title", () => {
        const text = { type: "text" as const, text: { content: "Task", link: { url: "https://example.com" } }, annotations: { bold: true } };
        expect(buildPropertyValue("title", [text])).toEqual({ title: [text] });
    });

    it.each([
        ["title", "Task", { title: [{ type: "text", text: { content: "Task" } }] }],
        ["rich_text", "Notes", { rich_text: [{ type: "text", text: { content: "Notes" } }] }],
        ["number", 0, { number: 0 }],
        ["checkbox", false, { checkbox: false }],
        ["select", "High", { select: { name: "High" } }],
        ["status", "Done", { status: { name: "Done" } }],
        ["multi_select", ["A", "B"], { multi_select: [{ name: "A" }, { name: "B" }] }],
        ["date", "2026-09-14", { date: { start: "2026-09-14" } }],
        ["date", { start: "2026-09-14", end: "2026-09-15" }, { date: { start: "2026-09-14", end: "2026-09-15" } }],
        // DATE values (Unix microseconds), e.g. a page timestamp or std::date::now.
        ["date", 1788256800000000, { date: { start: "2026-09-01T10:00:00.000Z" } }],
        ["date", { start: 1788256800000000, end: "2026-09-02" }, { date: { start: "2026-09-01T10:00:00.000Z", end: "2026-09-02" } }],
        ["people", ["user-1"], { people: [{ id: "user-1" }] }],
        ["relation", ["page-1"], { relation: [{ id: "page-1" }] }],
        ["url", "https://example.com", { url: "https://example.com" }],
        ["email", "test@example.com", { email: "test@example.com" }],
        ["phone_number", "+49123", { phone_number: "+49123" }],
        ["select", null, { select: null }],
        ["number", null, { number: null }],
        ["date", null, { date: null }],
    ])("builds %s values", (type, input, expected) => {
        const value = buildPropertyValue(type as string, input);
        expect(value).toEqual(expected);
        expect(NotionPropertyValueSchema.parse(value)).toEqual(expected);
    });

    it.each([["checkbox", "false"], ["number", "123"], ["multi_select", "one"], ["relation", [1]], ["formula", 5], ["__proto__", {}]])("rejects invalid %s values", (type, value) => {
        expect(() => buildPropertyValue(type as string, value)).toThrow();
    });

    it("enforces the rich-text item length limit", () => {
        expect(() => block.run(null, "paragraph", "x".repeat(2001))).toThrow();
        expect(() => buildPropertyValue("title", "x".repeat(2001))).toThrow();
    });
});
