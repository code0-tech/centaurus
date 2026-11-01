import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { NotionPageSchema } from "../src/data_types/notionPage.js";
import { NotionQueryResultSchema } from "../src/data_types/notionQueryResult.js";
import { NotionSearchResultSchema } from "../src/data_types/notionSearchResult.js";
import {
    CreatePageRequestSchema,
    SearchRequestSchema,
    UpdatePageRequestSchema,
} from "../src/helpers.js";
import {
    buildPropertyValue,
    CreatePropertyValueFunction,
} from "../src/functions/utils/createPropertyValueFunction.js";
import { CreateRichTextFunction } from "../src/functions/utils/createRichTextFunction.js";

const samplePage = {
    object: "page",
    id: "page-id-1",
    created_time: "2026-01-01T00:00:00.000Z",
    last_edited_time: "2026-01-02T00:00:00.000Z",
    parent: { type: "database_id", database_id: "db-1" },
    archived: false,
    properties: {
        Name: {
            id: "title",
            type: "title",
            title: [{ type: "text", text: { content: "Hello" }, plain_text: "Hello" }],
        },
        Priority: { id: "abc", type: "number", number: 3 },
    },
    url: "https://notion.so/page-id-1",
};

const sampleDatabase = {
    object: "database",
    id: "db-1",
    title: [{ type: "text", text: { content: "Tasks" }, plain_text: "Tasks" }],
    properties: {},
    parent: { type: "workspace", workspace: true },
    url: "https://notion.so/db-1",
};

describe("NotionPageSchema", () => {
    it("parses a representative page and preserves dynamic properties", () => {
        const parsed = NotionPageSchema.parse(samplePage);
        expect(parsed.id).toEqual("page-id-1");
        expect(parsed.properties?.Priority.number).toEqual(3);
    });
});

describe("NotionQueryResultSchema", () => {
    it("parses a paginated list of pages", () => {
        const parsed = NotionQueryResultSchema.parse({
            object: "list",
            results: [samplePage],
            next_cursor: null,
            has_more: false,
        });
        expect(parsed.results).toHaveLength(1);
        expect(parsed.results[0].object).toEqual("page");
    });
});

describe("NotionSearchResultSchema", () => {
    it("parses a list that mixes pages and databases", () => {
        const parsed = NotionSearchResultSchema.parse({
            object: "list",
            results: [samplePage, sampleDatabase],
            has_more: false,
        });
        expect(parsed.results.map((r) => r.object)).toEqual(["page", "database"]);
    });
});

describe("request schemas", () => {
    it("requires a parent database and properties to create a page", () => {
        expect(() => CreatePageRequestSchema.parse({ properties: {} })).toThrow();
        expect(() => CreatePageRequestSchema.parse({ parentDatabaseId: "db-1" })).toThrow();
        expect(CreatePageRequestSchema.parse({ parentDatabaseId: "db-1", properties: {} }).parentDatabaseId).toEqual(
            "db-1"
        );
    });

    it("requires a page id and properties to update a page", () => {
        expect(() => UpdatePageRequestSchema.parse({ properties: {} })).toThrow();
        expect(UpdatePageRequestSchema.parse({ pageId: "p1", properties: { Name: {} } }).pageId).toEqual("p1");
    });

    it("requires a query to search", () => {
        expect(() => SearchRequestSchema.parse({})).toThrow();
        expect(SearchRequestSchema.parse({ query: "notes" }).query).toEqual("notes");
    });
});

describe("buildPropertyValue", () => {
    it("wraps title and rich_text as rich text arrays", () => {
        expect(buildPropertyValue("title", "Hello")).toEqual({
            title: [{ type: "text", text: { content: "Hello" } }],
        });
        expect(buildPropertyValue("rich_text", "Body")).toEqual({
            rich_text: [{ type: "text", text: { content: "Body" } }],
        });
    });

    it("parses numbers and checkboxes", () => {
        expect(buildPropertyValue("number", "42")).toEqual({ number: 42 });
        expect(buildPropertyValue("number", "")).toEqual({ number: null });
        expect(buildPropertyValue("checkbox", "true")).toEqual({ checkbox: true });
        expect(buildPropertyValue("checkbox", "false")).toEqual({ checkbox: false });
    });

    it("wraps select, date, and scalar string types", () => {
        expect(buildPropertyValue("select", "Done")).toEqual({ select: { name: "Done" } });
        expect(buildPropertyValue("date", "2026-01-01")).toEqual({ date: { start: "2026-01-01" } });
        expect(buildPropertyValue("url", "https://x.dev")).toEqual({ url: "https://x.dev" });
    });

    it("is exposed by the CreatePropertyValueFunction", () => {
        const fn = new CreatePropertyValueFunction();
        expect(fn.run(undefined, "email", "a@b.dev")).toEqual({ email: "a@b.dev" });
    });
});

describe("CreateRichTextFunction", () => {
    it("builds a rich text object with annotations and an optional link", () => {
        const fn = new CreateRichTextFunction();
        const rich = fn.run(undefined, "Hi", true, undefined, undefined, undefined, undefined, undefined, "https://x.dev");
        expect(rich.text?.content).toEqual("Hi");
        expect(rich.text?.link).toEqual({ url: "https://x.dev" });
        expect(rich.annotations?.bold).toEqual(true);
        expect(rich.annotations?.italic).toEqual(false);
    });
});
