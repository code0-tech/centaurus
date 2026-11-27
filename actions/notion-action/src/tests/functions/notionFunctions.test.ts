import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotionCreatePageFunction } from "../../functions/notionCreatePageFunction.js";
import { NotionUpdatePageFunction } from "../../functions/notionUpdatePageFunction.js";
import { NotionGetPageFunction } from "../../functions/notionGetPageFunction.js";
import { NotionArchivePageFunction } from "../../functions/notionArchivePageFunction.js";
import { NotionQueryDatabaseFunction } from "../../functions/notionQueryDatabaseFunction.js";
import { NotionSearchFunction } from "../../functions/notionSearchFunction.js";
import { context, list, page, parsed, TOKEN } from "../fixtures.js";
import { mockNotionHttp } from "../httpMock.js";

const http = vi.hoisted(() => ({ request: vi.fn() }));
beforeEach(() => { http.request.mockReset(); mockNotionHttp(http.request); });
afterEach(() => vi.unstubAllGlobals());

describe("Notion functions", () => {
    const properties = { Name: { title: [{ type: "text" as const, text: { content: "Task" } }] } };
    const markdown = "## Notes\n\nSome **bold** text";

    it("creates a page with its database parent, properties and Markdown content", async () => {
        http.request.mockResolvedValue({ data: page() });
        expect(await new NotionCreatePageFunction().run(context(), TOKEN, "database-1", properties, markdown)).toEqual(parsed(page()));
        expect(http.request).toHaveBeenCalledWith({ method: "POST", url: "/pages", data: { parent: { data_source_id: "database-1-ds" }, properties, markdown, markdown_version: "v2" } });
        await new NotionCreatePageFunction().run(context(), TOKEN, "database-1", properties, null);
        expect(http.request.mock.lastCall?.[0].data).not.toHaveProperty("markdown");
    });

    it("updates only the requested properties", async () => {
        http.request.mockResolvedValue({ data: page() });
        await new NotionUpdatePageFunction().run(context(), TOKEN, "page-1", properties);
        expect(http.request).toHaveBeenCalledWith({ method: "PATCH", url: "/pages/page-1", data: { properties } });
    });

    it("retrieves the requested page", async () => {
        http.request.mockResolvedValue({ data: page() });
        expect(await new NotionGetPageFunction().run(context(), TOKEN, "page-1")).toEqual(parsed(page()));
        expect(http.request).toHaveBeenCalledWith({ method: "GET", url: "/pages/page-1", data: undefined });
    });

    it("returns the archive state confirmed by Notion", async () => {
        http.request.mockResolvedValueOnce({ data: page("page-1", { in_trash: true }) }).mockResolvedValueOnce({ data: page() });
        const fn = new NotionArchivePageFunction();
        expect(await fn.run(context(), TOKEN, "page-1")).toBe(true);
        expect(http.request).toHaveBeenCalledWith({ method: "PATCH", url: "/pages/page-1", data: { in_trash: true } });
        expect(await fn.run(context(), TOKEN, "page-1")).toBe(false);
    });

    it("queries with optional filter and sort values", async () => {
        http.request.mockResolvedValue({ data: list([page()]) });
        const filter = { property: "Done", checkbox: { equals: false } };
        const sorts = [{ property: "Name", direction: "ascending" as const }];
        expect((await new NotionQueryDatabaseFunction().run(context(), TOKEN, "db", filter, sorts)).results).toHaveLength(1);
        expect(http.request).toHaveBeenCalledWith({ method: "POST", url: "/data_sources/db-ds/query", data: { filter, sorts, page_size: 100 } });
    });

    it("searches with the requested object filter", async () => {
        http.request.mockResolvedValue({ data: list([page()]) });
        const filter = { property: "object" as const, value: "page" as const };
        expect((await new NotionSearchFunction().run(context(), TOKEN, "Task", filter)).results).toHaveLength(1);
        expect(http.request).toHaveBeenCalledWith({ method: "POST", url: "/search", data: { query: "Task", filter, page_size: 100 } });
    });
});
