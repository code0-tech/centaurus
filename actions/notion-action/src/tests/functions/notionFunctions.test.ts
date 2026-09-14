import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotionCreatePageFunction } from "../../functions/notionCreatePageFunction.js";
import { NotionUpdatePageFunction } from "../../functions/notionUpdatePageFunction.js";
import { NotionGetPageFunction } from "../../functions/notionGetPageFunction.js";
import { NotionArchivePageFunction } from "../../functions/notionArchivePageFunction.js";
import { NotionQueryDatabaseFunction } from "../../functions/notionQueryDatabaseFunction.js";
import { NotionAppendBlocksFunction } from "../../functions/notionAppendBlocksFunction.js";
import { NotionSearchFunction } from "../../functions/notionSearchFunction.js";
import { context, list, page } from "../fixtures.js";
import { mockNotionHttp } from "../httpMock.js";

const http = vi.hoisted(() => ({ request: vi.fn() }));
beforeEach(() => { http.request.mockReset(); mockNotionHttp(http.request); });
afterEach(() => vi.unstubAllGlobals());

describe("Notion functions", () => {
    const properties = { Name: { title: [{ type: "text" as const, text: { content: "Task" } }] } };
    const children = [{ object: "block" as const, type: "paragraph" as const, paragraph: { rich_text: [{ type: "text" as const, text: { content: "Notes" } }] } }];

    it("creates a page with its database parent, properties and initial blocks", async () => {
        http.request.mockResolvedValue({ data: page() });
        expect(await new NotionCreatePageFunction().run(context(), "database-1", properties, children)).toEqual(page());
        expect(http.request).toHaveBeenCalledWith({ method: "POST", url: "/pages", data: { parent: { database_id: "database-1" }, properties, children } });
        await new NotionCreatePageFunction().run(context(), "database-1", properties);
        expect(http.request.mock.lastCall?.[0].data).not.toHaveProperty("children");
    });

    it("updates only the requested properties", async () => {
        http.request.mockResolvedValue({ data: page() });
        await new NotionUpdatePageFunction().run(context(), "page-1", properties);
        expect(http.request).toHaveBeenCalledWith({ method: "PATCH", url: "/pages/page-1", data: { properties } });
    });

    it("retrieves the requested page", async () => {
        http.request.mockResolvedValue({ data: page() });
        expect(await new NotionGetPageFunction().run(context(), "page-1")).toEqual(page());
        expect(http.request).toHaveBeenCalledWith({ method: "GET", url: "/pages/page-1", data: undefined });
    });

    it("returns the archive state confirmed by Notion", async () => {
        http.request.mockResolvedValueOnce({ data: page("page-1", { archived: true }) }).mockResolvedValueOnce({ data: page() });
        const fn = new NotionArchivePageFunction();
        expect(await fn.run(context(), "page-1")).toBe(true);
        expect(http.request).toHaveBeenCalledWith({ method: "PATCH", url: "/pages/page-1", data: { archived: true } });
        expect(await fn.run(context(), "page-1")).toBe(false);
    });

    it("queries with optional filter and sort values", async () => {
        http.request.mockResolvedValue({ data: list([page()]) });
        const filter = { property: "Done", checkbox: { equals: false } };
        const sorts = [{ property: "Name", direction: "ascending" as const }];
        expect((await new NotionQueryDatabaseFunction().run(context(), "db", filter, sorts)).results).toHaveLength(1);
        expect(http.request).toHaveBeenCalledWith({ method: "POST", url: "/databases/db/query", data: { filter, sorts, page_size: 100 } });
    });

    it("appends block input and preserves block-specific response fields", async () => {
        const response = list([{ object: "block", id: "block-1" }], null, "block");
        http.request.mockResolvedValue({ data: response });
        expect(await new NotionAppendBlocksFunction().run(context(), "page-1", children)).toEqual(response);
        expect(http.request).toHaveBeenCalledWith({ method: "PATCH", url: "/blocks/page-1/children", data: { children } });
    });

    it("searches with the requested object filter", async () => {
        http.request.mockResolvedValue({ data: list([page()]) });
        const filter = { property: "object" as const, value: "page" as const };
        expect((await new NotionSearchFunction().run(context(), "Task", filter)).results).toHaveLength(1);
        expect(http.request).toHaveBeenCalledWith({ method: "POST", url: "/search", data: { query: "Task", filter, page_size: 100 } });
    });
});
