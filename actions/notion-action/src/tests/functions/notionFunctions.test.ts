import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotionCreatePageFunction } from "../../functions/notionCreatePageFunction.js";
import { NotionUpdatePageFunction } from "../../functions/notionUpdatePageFunction.js";
import { NotionGetPageFunction } from "../../functions/notionGetPageFunction.js";
import { NotionArchivePageFunction } from "../../functions/notionArchivePageFunction.js";
import { NotionSearchFunction } from "../../functions/notionSearchFunction.js";
import { context, list, page, parsed, TOKEN } from "../fixtures.js";
import { mockDataSources, mockNotionHttp, mockPageMarkdown } from "../httpMock.js";

const http = vi.hoisted(() => ({ request: vi.fn() }));
let fetchMock: ReturnType<typeof mockNotionHttp>;
beforeEach(() => { http.request.mockReset(); fetchMock = mockNotionHttp(http.request); });
afterEach(() => vi.unstubAllGlobals());

describe("Notion functions", () => {
    const markdown = "## Notes\n\nSome **bold** text";
    const titled = (content: string) => ({ title: { title: [{ type: "text", text: { content } }] } });

    it("creates a database entry with a title and Markdown content", async () => {
        http.request.mockResolvedValue({ data: page() });
        expect(await new NotionCreatePageFunction().run(context(), TOKEN, "database-1", " Task ", markdown)).toEqual(parsed(page()));
        expect(http.request).toHaveBeenCalledExactlyOnceWith({ method: "POST", url: "/pages", data: { parent: { data_source_id: "database-1-ds" }, properties: titled("Task"), markdown, markdown_version: "v2" } });
        await new NotionCreatePageFunction().run(context(), TOKEN, "database-1", "Task", null);
        expect(http.request.mock.lastCall?.[0].data).not.toHaveProperty("markdown");
    });

    it("creates a subpage when the parent is a page", async () => {
        http.request.mockResolvedValue({ data: page() });
        mockDataSources.resolve = (id) => id === "page-1" ? null : [`${id}-ds`];
        await new NotionCreatePageFunction().run(context(), TOKEN, "page-1", "Notes", markdown);
        expect(fetchMock.databaseLookups).toHaveBeenCalledExactlyOnceWith("page-1");
        expect(http.request).toHaveBeenCalledExactlyOnceWith({ method: "POST", url: "/pages", data: { parent: { page_id: "page-1" }, properties: titled("Notes"), markdown, markdown_version: "v2" } });
    });

    it("does not fall back to a page for other lookup failures", async () => {
        mockDataSources.resolve = () => ["ds-1", "ds-2"];
        await expect(new NotionCreatePageFunction().run(context(), TOKEN, "database-1", "Task")).rejects.toMatchObject({ code: "NOTION_MULTIPLE_DATA_SOURCES" });
        expect(http.request).not.toHaveBeenCalled();
    });

    it("changes the title and replaces the content as Markdown", async () => {
        http.request.mockResolvedValue({ data: page() });
        expect(await new NotionUpdatePageFunction().run(context(), TOKEN, "page-1", "Renamed", markdown)).toEqual({ ...parsed(page()), markdown });
        expect(http.request).toHaveBeenCalledExactlyOnceWith({ method: "PATCH", url: "/pages/page-1", data: { properties: titled("Renamed") } });
        expect(fetchMock.markdownUpdates).toHaveBeenCalledExactlyOnceWith("page-1", { markdown_version: "v2", type: "replace_content", replace_content: { new_str: markdown } });
    });

    it("leaves an empty title or content unchanged", async () => {
        http.request.mockResolvedValue({ data: page() });
        const update = new NotionUpdatePageFunction();
        expect(await update.run(context(), TOKEN, "page-1", "", markdown)).toEqual({ ...parsed(page()), markdown });
        expect(http.request).toHaveBeenCalledExactlyOnceWith({ method: "GET", url: "/pages/page-1", data: undefined });
        http.request.mockClear();
        expect(await update.run(context(), TOKEN, "page-1", "Renamed", "")).toEqual(parsed(page()));
        expect(http.request).toHaveBeenCalledExactlyOnceWith({ method: "PATCH", url: "/pages/page-1", data: { properties: titled("Renamed") } });
        await update.run(context(), TOKEN, "page-1", null, null);
        expect(fetchMock.markdownUpdates).toHaveBeenCalledOnce();
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

    it("searches titles for the given text", async () => {
        http.request.mockResolvedValue({ data: list([page()]) });
        expect((await new NotionSearchFunction().run(context(), TOKEN, "Task")).results).toHaveLength(1);
        expect(http.request).toHaveBeenCalledExactlyOnceWith({ method: "POST", url: "/search", data: { query: "Task", page_size: 100 } });
    });
});
