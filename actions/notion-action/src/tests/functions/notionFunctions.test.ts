import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotionCreatePageFunction } from "../../functions/notionCreatePageFunction.js";
import { NotionUpdatePageFunction } from "../../functions/notionUpdatePageFunction.js";
import { NotionGetPageFunction } from "../../functions/notionGetPageFunction.js";
import { NotionArchivePageFunction } from "../../functions/notionArchivePageFunction.js";
import { NotionQueryDatabaseFunction } from "../../functions/notionQueryDatabaseFunction.js";
import { NotionSearchFunction } from "../../functions/notionSearchFunction.js";
import { context, list, page, parsed, TOKEN } from "../fixtures.js";
import { mockNotionHttp, mockPageMarkdown } from "../httpMock.js";

const http = vi.hoisted(() => ({ request: vi.fn() }));
let fetchMock: ReturnType<typeof mockNotionHttp>;
beforeEach(() => { http.request.mockReset(); fetchMock = mockNotionHttp(http.request); });
afterEach(() => vi.unstubAllGlobals());

describe("Notion functions", () => {
    const properties = { Name: "Task", Done: true };
    const notionProperties = { Name: { title: [{ type: "text", text: { content: "Task" } }] }, Done: { checkbox: true } };
    const columns = { Name: { id: "title", type: "title" }, Done: { id: "done", type: "checkbox" } };
    const markdown = "## Notes\n\nSome **bold** text";

    // Answers the column lookup (data source or page) and returns a page for writes.
    const respond = async ({ method, url }: { method?: string; url: string }) => method === "GET"
        ? { data: url.startsWith("/data_sources/") ? { object: "data_source", id: "ds", properties: columns } : page("page-1", { properties: columns as never }) }
        : { data: page() };

    it("creates a page from plain column values and Markdown content", async () => {
        http.request.mockImplementation(respond);
        expect(await new NotionCreatePageFunction().run(context(), TOKEN, "database-1", properties, markdown)).toEqual(parsed(page()));
        expect(http.request).toHaveBeenCalledWith({ method: "GET", url: "/data_sources/database-1-ds", data: undefined });
        expect(http.request).toHaveBeenLastCalledWith({ method: "POST", url: "/pages", data: { parent: { data_source_id: "database-1-ds" }, properties: notionProperties, markdown, markdown_version: "v2" } });
        await new NotionCreatePageFunction().run(context(), TOKEN, "database-1", properties, null);
        expect(http.request.mock.lastCall?.[0].data).not.toHaveProperty("markdown");
    });

    it("updates only the requested columns, converted with the page's column types", async () => {
        http.request.mockImplementation(respond);
        await new NotionUpdatePageFunction().run(context(), TOKEN, "page-1", { Done: false });
        expect(http.request).toHaveBeenCalledWith({ method: "GET", url: "/pages/page-1", data: undefined });
        expect(http.request).toHaveBeenLastCalledWith({ method: "PATCH", url: "/pages/page-1", data: { properties: { Done: { checkbox: false } } } });
    });

    it("rejects unknown columns before writing", async () => {
        http.request.mockImplementation(respond);
        await expect(new NotionCreatePageFunction().run(context(), TOKEN, "database-1", { Missing: "x" })).rejects.toMatchObject({ code: "NOTION_UNKNOWN_PROPERTY" });
        expect(http.request).not.toHaveBeenCalledWith(expect.objectContaining({ method: "POST", url: "/pages" }));
    });

    it("retrieves the requested page with its content as Markdown", async () => {
        http.request.mockResolvedValue({ data: page() });
        mockPageMarkdown.value = "## Notes\n\n- [ ] Ship";
        expect(await new NotionGetPageFunction().run(context(), TOKEN, "page-1")).toEqual({ ...parsed(page()), markdown: "## Notes\n\n- [ ] Ship" });
        expect(http.request).toHaveBeenCalledWith({ method: "GET", url: "/pages/page-1", data: undefined });
        expect(fetchMock.markdownLookups).toHaveBeenCalledExactlyOnceWith("page-1", expect.any(URLSearchParams));
        expect(fetchMock.markdownLookups.mock.lastCall?.[1].get("markdown_version")).toBe("v2");
    });

    it("returns the archive state confirmed by Notion", async () => {
        http.request.mockResolvedValueOnce({ data: page("page-1", { in_trash: true }) }).mockResolvedValueOnce({ data: page() });
        const fn = new NotionArchivePageFunction();
        expect(await fn.run(context(), TOKEN, "page-1")).toBe(true);
        expect(http.request).toHaveBeenCalledWith({ method: "PATCH", url: "/pages/page-1", data: { in_trash: true } });
        expect(await fn.run(context(), TOKEN, "page-1")).toBe(false);
    });

    it("queries with an optional filter, newest first unless sorted by a column", async () => {
        http.request.mockResolvedValue({ data: list([page()]) });
        const filter = { property: "Done", checkbox: { equals: false } };
        const sorts = [{ timestamp: "created_time", direction: "descending" }];
        expect((await new NotionQueryDatabaseFunction().run(context(), TOKEN, "db", filter)).results).toHaveLength(1);
        expect(http.request).toHaveBeenCalledWith({ method: "POST", url: "/data_sources/db-ds/query", data: { filter, sorts, page_size: 100 } });
        const query = new NotionQueryDatabaseFunction();
        const sortedBy = async (property: string | null, direction: "ascending" | "descending" | null) => {
            await query.run(context(), TOKEN, "db", null, property, direction);
            return http.request.mock.lastCall?.[0].data.sorts;
        };
        expect(await sortedBy("Due", null)).toEqual([{ property: "Due", direction: "ascending" }]);
        expect(await sortedBy("Due", "descending")).toEqual([{ property: "Due", direction: "descending" }]);
        expect(await sortedBy(null, "ascending")).toEqual([{ timestamp: "created_time", direction: "ascending" }]);
        expect(await sortedBy(" ", null)).toEqual([{ timestamp: "created_time", direction: "descending" }]);
        await expect(query.run(context(), TOKEN, "db", null, "Due", "up" as "ascending")).rejects.toMatchObject({ code: "NOTION_INVALID_SORT" });
    });

    it("searches with the requested object filter", async () => {
        http.request.mockResolvedValue({ data: list([page()]) });
        const filter = { property: "object" as const, value: "page" as const };
        expect((await new NotionSearchFunction().run(context(), TOKEN, "Task", filter)).results).toHaveLength(1);
        expect(http.request).toHaveBeenCalledWith({ method: "POST", url: "/search", data: { query: "Task", filter, page_size: 100 } });
    });
});
