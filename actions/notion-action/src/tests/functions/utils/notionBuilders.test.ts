import { describe, expect, it } from "vitest";
import { NotionCreateRichTextFunction } from "../../../functions/utils/notionCreateRichTextFunction.js";
import { NotionCreatePropertyValueFunction } from "../../../functions/utils/notionCreatePropertyValueFunction.js";
import { NotionPropertyValueSchema } from "../../../data_types/notionPropertyValue.js";
import { NotionCreateBlockFunction } from "../../../functions/utils/notionCreateBlockFunction.js";

describe("Notion builders", () => {
    const property = new NotionCreatePropertyValueFunction();
    const richText = new NotionCreateRichTextFunction();
    const block = new NotionCreateBlockFunction();

    it("builds text blocks from plain text or rich-text items", () => {
        expect(block.run(null, "paragraph", "Hello")).toEqual({ type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: "Hello" } }] } });
        const text = richText.run(null, "Bold", null, true);
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

    it("builds linked and formatted text usable as a title", () => {
        const text = richText.run(null, "Task", "https://example.com", true, true);
        expect(text).toEqual({ type: "text", text: { content: "Task", link: { url: "https://example.com" } }, annotations: { bold: true, italic: true } });
        expect(property.run(null, "title", [text])).toEqual({ title: [text] });
        expect(richText.run(null, "Plain").text).not.toHaveProperty("link");
    });

    it("treats null optional arguments from a flow as unset", () => {
        expect(richText.run(null, "Plain", null, null, null)).toEqual({ type: "text", text: { content: "Plain" }, annotations: { bold: false, italic: false } });
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
