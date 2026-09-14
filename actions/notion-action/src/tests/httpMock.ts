import { vi } from "vitest";

// Exercise the real Notion SDK, replacing only its network boundary.
export function mockNotionHttp(request: (args: { method?: string; url: string; data: unknown }) => Promise<{ data: unknown; status?: number; headers?: HeadersInit }>) {
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const response = await request({
            method: init?.method,
            url: new URL(String(url)).pathname.replace(/^\/v1/, ""),
            data: init?.body ? JSON.parse(String(init.body)) : undefined,
        });
        return new Response(JSON.stringify(response.data), { status: response.status ?? 200, headers: response.headers });
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}
