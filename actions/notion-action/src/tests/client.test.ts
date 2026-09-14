import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotionClient } from "../client.js";
import { config, list, page } from "./fixtures.js";
import { mockNotionHttp } from "./httpMock.js";

const http = vi.hoisted(() => ({ request: vi.fn() }));
let fetchMock: ReturnType<typeof mockNotionHttp>;
beforeEach(() => { vi.clearAllMocks(); http.request.mockReset(); fetchMock = mockNotionHttp(http.request); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Notion API client", () => {
    it("uses isolated project credentials and the pinned header", async () => {
        http.request.mockResolvedValue({ data: page() });
        await new NotionClient(config()).getPage("page");
        await new NotionClient(config({ integration_token: "other-token" })).getPage("page");
        const first = new Headers(fetchMock.mock.calls[0][1]?.headers);
        const second = new Headers(fetchMock.mock.calls[1][1]?.headers);
        expect(first.get("authorization")).toBe("Bearer test-token");
        expect(first.get("notion-version")).toBe("2022-06-28");
        expect(second.get("authorization")).toBe("Bearer other-token");
        expect(fetchMock.mock.calls[0][1]?.redirect).toBe("error");
    });

    it("uses the environment fallback but rejects missing tokens and incompatible versions", async () => {
        vi.stubEnv("NOTION_INTEGRATION_TOKEN", "environment-token");
        http.request.mockResolvedValue({ data: page() });
        await new NotionClient(config({})).getPage("page");
        expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("authorization")).toBe("Bearer environment-token");
        expect(() => new NotionClient(config({ integration_token: "" }))).toThrow(/integration_token/);
        expect(() => new NotionClient(config({ integration_token: "test", notion_version: "2025-09-03" }))).toThrow(/2022-06-28/);
    });

    it("collects database pages and preserves filters and sorts across cursors", async () => {
        http.request.mockResolvedValueOnce({ data: list([page()], "cursor-2") }).mockResolvedValueOnce({ data: list([page("page-2")]) });
        const filter = { property: "Done", checkbox: { equals: false } };
        const sorts = [{ timestamp: "last_edited_time", direction: "ascending" }] as const;
        const result = await new NotionClient(config()).queryDatabase("db/1", filter, [...sorts]);
        expect(result.results).toHaveLength(2);
        expect(result).toMatchObject({ has_more: false, next_cursor: null });
        expect(http.request).toHaveBeenNthCalledWith(2, { method: "POST", url: "/databases/db%2F1/query", data: { page_size: 100, filter, sorts, start_cursor: "cursor-2" } });
    });

    it("paginates search even when an intermediate page has no results", async () => {
        http.request.mockResolvedValueOnce({ data: list([], "cursor-2") }).mockResolvedValueOnce({ data: list([page()]) });
        const filter = { property: "object", value: "page" } as const;
        expect((await new NotionClient(config()).search("Tasks", filter)).results).toHaveLength(1);
        expect(http.request).toHaveBeenLastCalledWith({ method: "POST", url: "/search", data: { query: "Tasks", filter, page_size: 100, start_cursor: "cursor-2" } });
    });

    it("rejects looping or missing pagination cursors", async () => {
        http.request.mockResolvedValue({ data: list([], "same") });
        await expect(new NotionClient(config()).queryDatabase("db")).rejects.toMatchObject({ code: "NOTION_INVALID_CURSOR" });
        expect(http.request).toHaveBeenCalledTimes(2);
        http.request.mockResolvedValue({ data: { ...list([]), has_more: true } });
        await expect(new NotionClient(config()).search("")).rejects.toMatchObject({ code: "NOTION_INVALID_CURSOR" });
    });

    it("validates responses without dropping nested Notion fields", async () => {
        const original = page("page-1", { icon: { type: "emoji", emoji: "🚀" }, properties: { Count: { id: "count", type: "formula", formula: { type: "number", number: 7 } } } });
        http.request.mockResolvedValueOnce({ data: original }).mockResolvedValueOnce({ data: { object: "page" } });
        const client = new NotionClient(config());
        expect(await client.getPage("page-1")).toEqual(original);
        await expect(client.getPage("page-2")).rejects.toMatchObject({ code: "NOTION_INVALID_RESPONSE" });
    });

    it("rejects invalid block counts and empty IDs before issuing requests", async () => {
        const client = new NotionClient(config());
        expect(() => client.appendBlocks("page", [])).toThrow();
        expect(() => client.appendBlocks("page", Array.from({ length: 101 }, () => ({ type: "paragraph" as const, paragraph: { rich_text: [] } })))).toThrow();
        expect(() => client.createPage("db", {}, Array.from({ length: 101 }, () => ({ type: "paragraph" as const, paragraph: { rich_text: [] } })))).toThrow();
        expect(() => client.getPage(" ")).toThrow();
        expect(http.request).not.toHaveBeenCalled();
    });

    it("honors Retry-After for 429 and retries only a bounded number of times", async () => {
        vi.useFakeTimers();
        const error = { status: 429, headers: { "retry-after": "2" }, data: { object: "error", status: 429, code: "rate_limited", message: "Rate limited" } };
        http.request.mockResolvedValueOnce(error).mockResolvedValueOnce({ data: page() });
        const request = new NotionClient(config()).getPage("page");
        await vi.advanceTimersByTimeAsync(1999);
        expect(http.request).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        await expect(request).resolves.toMatchObject({ id: "page-1" });
        http.request.mockResolvedValue(error);
        const rejected = expect(new NotionClient(config()).getPage("page")).rejects.toMatchObject({ code: "NOTION_HTTP_429" });
        await vi.runAllTimersAsync();
        await rejected;
        expect(http.request).toHaveBeenCalledTimes(5);
    });

    it("does not retry writes on ambiguous network failures or disclose credentials", async () => {
        http.request.mockRejectedValue(new Error("Bearer secret-token"));
        let failure: unknown;
        try { await new NotionClient(config()).createPage("db", {}); } catch (error) { failure = error; }
        expect(failure).toMatchObject({ code: "NOTION_NETWORK_ERROR" });
        expect(JSON.stringify(failure)).not.toContain("secret-token");
        expect(http.request).toHaveBeenCalledTimes(1);
    });
});
