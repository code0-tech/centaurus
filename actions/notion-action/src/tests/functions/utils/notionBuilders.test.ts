import { describe, expect, it } from "vitest";
import { NotionCreateRichTextFunction } from "../../../functions/utils/notionCreateRichTextFunction.js";
import { NotionCreatePropertyValueFunction } from "../../../functions/utils/notionCreatePropertyValueFunction.js";
import { NotionPropertyValueSchema } from "../../../data_types/notionPropertyValue.js";

describe("Notion builders", () => {
    const property = new NotionCreatePropertyValueFunction();
    const richText = new NotionCreateRichTextFunction();

    it("builds linked and formatted text usable as a title", () => {
        const text = richText.run(null, "Task", "https://example.com", true, true);
        expect(text).toEqual({ type: "text", text: { content: "Task", link: { url: "https://example.com" } }, annotations: { bold: true, italic: true } });
        expect(property.run(null, "title", [text])).toEqual({ title: [text] });
        expect(richText.run(null, "Plain").text).not.toHaveProperty("link");
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
        ["people", ["user-1"], { people: [{ id: "user-1" }] }],
        ["relation", ["page-1"], { relation: [{ id: "page-1" }] }],
        ["url", "https://example.com", { url: "https://example.com" }],
        ["email", "test@example.com", { email: "test@example.com" }],
        ["phone_number", "+49123", { phone_number: "+49123" }],
        ["select", null, { select: null }],
        ["number", null, { number: null }],
        ["date", null, { date: null }],
    ])("builds %s values", (type, input, expected) => {
        const value = property.run(null, type as string, input);
        expect(value).toEqual(expected);
        expect(NotionPropertyValueSchema.parse(value)).toEqual(expected);
    });

    it.each([["checkbox", "false"], ["number", "123"], ["multi_select", "one"], ["relation", [1]], ["formula", 5], ["__proto__", {}]])("rejects invalid %s values", (type, value) => {
        expect(() => property.run(null, type as string, value)).toThrow();
    });

    it("enforces the rich-text item length limit", () => {
        expect(() => richText.run(null, "x".repeat(2001))).toThrow();
        expect(() => property.run(null, "title", "x".repeat(2001))).toThrow();
    });
});
