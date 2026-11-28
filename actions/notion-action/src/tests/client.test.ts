import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotionClient, withNotionDates } from "../client.js";
import { list, page, parsed, TOKEN } from "./fixtures.js";
import { mockDataSources, mockNotionHttp } from "./httpMock.js";

const http = vi.hoisted(() => ({ request: vi.fn() }));
let fetchMock: ReturnType<typeof mockNotionHttp>;
beforeEach(() => { vi.clearAllMocks(); http.request.mockReset(); fetchMock = mockNotionHttp(http.request); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Notion timestamps", () => {
    it("converts ISO timestamps of known fields into DATE microseconds", () => {
        expect(withNotionDates({
            created_time: "2026-09-01T10:00:00.000Z",
            nested: [{ last_edited_time: "2026-09-01T10:00:00.500Z", file: { expiry_time: "2026-09-01T11:00:00.000Z" } }],
            date: { start: "2026-09-01", end: null },
            title: "2026-09-01T10:00:00.000Z",
        })).toEqual({
            created_time: 1788256800000000,
            nested: [{ last_edited_time: 1788256800500000, file: { expiry_time: 1788260400000000 } }],
            date: { start: "2026-09-01", end: null },
            title: "2026-09-01T10:00:00.000Z",
        });
    });

    it("leaves unparseable timestamps for response validation to reject", () => {
        expect(withNotionDates({ created_time: "yesterday" })).toEqual({ created_time: "yesterday" });
    });
});

describe("Notion API client", () => {
    it("uses the given integration token and the pinned header", async () => {
        http.request.mockResolvedValue({ data: page() });
        await new NotionClient(TOKEN).getPage("page");
        await new NotionClient("other-token").getPage("page");
        const first = new Headers(fetchMock.mock.calls[0][1]?.headers);
        const second = new Headers(fetchMock.mock.lastCall?.[1]?.headers);
        expect(first.get("authorization")).toBe("Bearer test-token");
        expect(first.get("notion-version")).toBe("2025-09-03");
        expect(second.get("authorization")).toBe("Bearer other-token");
        expect(fetchMock.mock.calls[0][1]?.redirect).toBe("error");
    });

    it("rejects a missing integration token", () => {
        expect(() => new NotionClient("")).toThrow(/integration token/);
        expect(() => new NotionClient(" ")).toThrow(/integration token/);
    });

    it("collects database pages newest first and preserves the filter across cursors", async () => {
        http.request.mockResolvedValueOnce({ data: list([page()], "cursor-2") }).mockResolvedValueOnce({ data: list([page("page-2")]) });
        const filter = { property: "Done", checkbox: { equals: false } };
        const sorts = [{ timestamp: "created_time", direction: "descending" }];
        const result = await new NotionClient(TOKEN).queryDatabase("db/1", filter);
        expect(result.results).toHaveLength(2);
        expect(result).toMatchObject({ has_more: false, next_cursor: null });
        expect(http.request).toHaveBeenNthCalledWith(2, { method: "POST", url: "/data_sources/db%2F1-ds/query", data: { page_size: 100, filter, sorts, start_cursor: "cursor-2" } });
        expect(fetchMock.databaseLookups).toHaveBeenCalledExactlyOnceWith("db/1");
    });

    it("paginates search even when an intermediate page has no results", async () => {
        http.request.mockResolvedValueOnce({ data: list([], "cursor-2") }).mockResolvedValueOnce({ data: list([page()]) });
        const filter = { property: "object", value: "page" } as const;
        expect((await new NotionClient(TOKEN).search("Tasks", filter)).results).toHaveLength(1);
        expect(http.request).toHaveBeenLastCalledWith({ method: "POST", url: "/search", data: { query: "Tasks", filter, page_size: 100, start_cursor: "cursor-2" } });
    });

    it("rejects looping or missing pagination cursors", async () => {
        http.request.mockResolvedValue({ data: list([], "same") });
        await expect(new NotionClient(TOKEN).queryDatabase("db")).rejects.toMatchObject({ code: "NOTION_INVALID_CURSOR" });
        expect(http.request).toHaveBeenCalledTimes(2);
        http.request.mockResolvedValue({ data: { ...list([]), has_more: true } });
        await expect(new NotionClient(TOKEN).search("")).rejects.toMatchObject({ code: "NOTION_INVALID_CURSOR" });
    });

    it("omits optional arguments that a flow passes as null", async () => {
        const client = new NotionClient(TOKEN);
        http.request.mockResolvedValueOnce({ data: list([page()]) });
        await client.queryDatabase("db", null);
        expect(http.request).toHaveBeenLastCalledWith({ method: "POST", url: "/data_sources/db-ds/query", data: { page_size: 100, sorts: [{ timestamp: "created_time", direction: "descending" }] } });
        http.request.mockResolvedValueOnce({ data: list([page()]) });
        await client.search("Tasks", null);
        expect(http.request).toHaveBeenLastCalledWith({ method: "POST", url: "/search", data: { query: "Tasks", page_size: 100 } });
        http.request.mockResolvedValueOnce({ data: page() });
        await client.createPage("db", "", null);
        expect(http.request).toHaveBeenLastCalledWith({ method: "POST", url: "/pages", data: { parent: { data_source_id: "db-ds" }, properties: { title: { title: [] } } } });
    });

    it("sends page content as Notion-flavored Markdown", async () => {
        const client = new NotionClient(TOKEN);
        http.request.mockResolvedValueOnce({ data: page() });
        await client.createPage("db", "Summary", "# Summary\n\n- [ ] Ship");
        expect(http.request).toHaveBeenLastCalledWith({ method: "POST", url: "/pages", data: { parent: { data_source_id: "db-ds" }, properties: { title: { title: [{ type: "text", text: { content: "Summary" } }] } }, markdown: "# Summary\n\n- [ ] Ship", markdown_version: "v2" } });
        http.request.mockResolvedValueOnce({ data: page() });
        await client.createPage("db", "Summary", "");
        expect(http.request.mock.lastCall?.[0].data).not.toHaveProperty("markdown");
        await expect(client.createPage("db", "Summary", 1 as unknown as string)).rejects.toMatchObject({ code: "NOTION_INVALID_MARKDOWN" });
        await expect(client.createPage("db", null as unknown as string)).rejects.toMatchObject({ code: "NOTION_INVALID_TITLE" });
    });

    it("validates responses without dropping nested Notion fields", async () => {
        const original = page("page-1", { icon: { type: "emoji", emoji: "🚀" }, properties: { Count: { id: "count", type: "formula", formula: { type: "number", number: 7 } } } });
        http.request.mockResolvedValueOnce({ data: original }).mockResolvedValueOnce({ data: { object: "page" } });
        const client = new NotionClient(TOKEN);
        expect(await client.getPage("page-1")).toEqual({ ...parsed(original), markdown: "# Page content" });
        await expect(client.getPage("page-2")).rejects.toMatchObject({ code: "NOTION_INVALID_RESPONSE" });
    });

    it("rejects empty IDs before issuing requests", async () => {
        const client = new NotionClient(TOKEN);
        await expect(client.getPage(" ")).rejects.toThrow();
        expect(http.request).not.toHaveBeenCalled();
        expect(fetchMock.databaseLookups).not.toHaveBeenCalled();
    });

    it("rejects databases without exactly one data source before querying or writing", async () => {
        const client = new NotionClient(TOKEN);
        mockDataSources.resolve = () => ["ds-1", "ds-2"];
        await expect(client.queryDatabase("db")).rejects.toMatchObject({ code: "NOTION_MULTIPLE_DATA_SOURCES" });
        await expect(client.createPage("db", "Task")).rejects.toMatchObject({ code: "NOTION_MULTIPLE_DATA_SOURCES" });
        mockDataSources.resolve = () => [];
        await expect(client.queryDatabase("db")).rejects.toMatchObject({ code: "NOTION_NO_DATA_SOURCE" });
        expect(http.request).not.toHaveBeenCalled();
    });

    it("honors Retry-After for 429 and retries only a bounded number of times", async () => {
        vi.useFakeTimers();
        const error = { status: 429, headers: { "retry-after": "2" }, data: { object: "error", status: 429, code: "rate_limited", message: "Rate limited" } };
        http.request.mockResolvedValueOnce(error).mockResolvedValueOnce({ data: page() });
        const request = new NotionClient(TOKEN).getPage("page");
        await vi.advanceTimersByTimeAsync(1999);
        expect(http.request).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        await expect(request).resolves.toMatchObject({ id: "page-1" });
        http.request.mockResolvedValue(error);
        const rejected = expect(new NotionClient(TOKEN).getPage("page")).rejects.toMatchObject({ code: "NOTION_HTTP_429" });
        await vi.runAllTimersAsync();
        await rejected;
        expect(http.request).toHaveBeenCalledTimes(5);
    });

    it("does not retry writes on ambiguous network failures or disclose credentials", async () => {
        http.request.mockRejectedValue(new Error("Bearer secret-token"));
        let failure: unknown;
        try { await new NotionClient(TOKEN).createPage("db", "Task"); } catch (error) { failure = error; }
        expect(failure).toMatchObject({ code: "NOTION_NETWORK_ERROR" });
        expect(JSON.stringify(failure)).not.toContain("secret-token");
        expect(http.request).toHaveBeenCalledTimes(1);
    });
});
