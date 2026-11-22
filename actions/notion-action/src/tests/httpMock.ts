import { vi } from "vitest";

type NotionRequest = { method?: string; url: string; data: unknown };

/**
 * Data source IDs a mocked database resolves to. By default every database
 * holds exactly one data source, `<databaseId>-ds`, so tests about other
 * behaviour don't have to answer the lookup that precedes database requests.
 */
export const mockDataSources = { resolve: (databaseId: string): string[] => [`${databaseId}-ds`] };

// Exercise the real Notion SDK, replacing only its network boundary.
export function mockNotionHttp(request: (args: NotionRequest) => Promise<{ data: unknown; status?: number; headers?: HeadersInit }>) {
    mockDataSources.resolve = (databaseId) => [`${databaseId}-ds`];
    const databaseLookups = vi.fn<(databaseId: string) => void>();
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const args = {
            method: init?.method,
            url: new URL(String(url)).pathname.replace(/^\/v1/, ""),
            data: init?.body ? JSON.parse(String(init.body)) : undefined,
        };
        const lookup = args.method === "GET" ? /^\/databases\/([^/]+)$/.exec(args.url) : null;
        if (lookup) {
            const databaseId = decodeURIComponent(lookup[1]);
            databaseLookups(databaseId);
            const data_sources = mockDataSources.resolve(databaseId).map((id) => ({ id, name: id }));
            return new Response(JSON.stringify({ object: "database", id: databaseId, data_sources }), { status: 200 });
        }
        const response = await request(args);
        return new Response(JSON.stringify(response.data), { status: response.status ?? 200, headers: response.headers });
    });
    vi.stubGlobal("fetch", fetchMock);
    return Object.assign(fetchMock, { databaseLookups });
}
