import { RuntimeError } from "@code0-tech/hercules";

/**
 * A thin client for the Airtable Web API.
 *
 * The action holds no credentials of its own: every function and every event
 * brings the personal access token it works with, so one running action serves
 * as many Airtable accounts as its flows use. Requests are plain HTTPS calls,
 * there is no connection to keep alive per token.
 */
export const AIRTABLE_API_URL = "https://api.airtable.com/v0";

/**
 * Airtable answers a burst of more than five requests per second and base with
 * 429 and rejects every request of that token for the next 30 seconds - so a
 * rate limited request waits that long once before it gives up.
 */
export const RATE_LIMIT_PENALTY_MS = 30 * 1000;

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type QueryValue = string | number | boolean | undefined | null;

export interface AirtableRequestOptions {
    method?: HttpMethod;
    query?: Record<string, QueryValue>;
    body?: unknown;
}

/** Swappable for tests, so a rate limit does not make a test wait 30 seconds. */
export const transport = {
    fetch: (input: string, init: RequestInit): Promise<Response> => fetch(input, init),
    sleep: (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms)),
};

export function requireToken(apiToken: string | undefined | null): string {
    const trimmed = typeof apiToken === "string" ? apiToken.trim() : "";
    if (!trimmed) {
        throw new RuntimeError("AIRTABLE_MISSING_API_TOKEN", "No Airtable personal access token was given.");
    }
    return trimmed;
}

export function requireId(value: string | undefined | null, name: string): string {
    const trimmed = value === undefined || value === null ? "" : String(value).trim();
    if (!trimmed) {
        throw new RuntimeError("AIRTABLE_MISSING_PARAMETER", `No ${name} was given.`);
    }
    return trimmed;
}

/** The path of a table. The table may be given by its id or by its name. */
export function tablePath(baseId: string, tableId: string): string {
    return `/${encodeURIComponent(requireId(baseId, "base id"))}/${encodeURIComponent(requireId(tableId, "table id"))}`;
}

export function recordPath(baseId: string, tableId: string, recordId: string): string {
    return `${tablePath(baseId, tableId)}/${encodeURIComponent(requireId(recordId, "record id"))}`;
}

export async function airtableRequest<T>(
    apiToken: string,
    path: string,
    options: AirtableRequestOptions = {}
): Promise<T> {
    const token = requireToken(apiToken);
    const url = buildUrl(path, options.query);
    const init: RequestInit = {
        method: options.method ?? "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    };

    let response = await send(url, init);
    if (response.status === 429) {
        await transport.sleep(RATE_LIMIT_PENALTY_MS);
        response = await send(url, init);
    }

    const payload = await readBody(response);
    if (!response.ok) {
        throw toRuntimeError(response.status, payload);
    }

    return payload as T;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
    const url = new URL(`${AIRTABLE_API_URL}${path}`);
    for (const [key, value] of Object.entries(query ?? {})) {
        if (value === undefined || value === null || value === "") continue;
        url.searchParams.append(key, String(value));
    }
    return url.toString();
}

async function send(url: string, init: RequestInit): Promise<Response> {
    try {
        return await transport.fetch(url, init);
    } catch (error: any) {
        throw new RuntimeError(
            "AIRTABLE_REQUEST_FAILED",
            `Could not reach Airtable: ${error?.message ?? String(error)}`
        );
    }
}

async function readBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return undefined;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

/**
 * Airtable reports errors either as `{ error: { type, message } }` or, for an
 * unknown route, as `{ error: "NOT_FOUND" }`.
 */
export function toRuntimeError(status: number, payload: unknown): RuntimeError {
    const error = (payload as { error?: unknown } | undefined)?.error;
    const type = typeof error === "string" ? error : (error as { type?: string } | undefined)?.type;
    const detail = typeof error === "object" && error ? (error as { message?: string }).message : undefined;
    const message = [type, detail].filter(Boolean).join(": ") || `Airtable answered with HTTP ${status}.`;

    switch (status) {
        case 400:
            return new RuntimeError("AIRTABLE_BAD_REQUEST", message);
        case 401:
            return new RuntimeError("AIRTABLE_UNAUTHORIZED", `The personal access token was rejected: ${message}`);
        case 403:
            return new RuntimeError(
                "AIRTABLE_FORBIDDEN",
                `The token has no access to this base or table, or it does not exist: ${message}`
            );
        case 404:
            return new RuntimeError("AIRTABLE_NOT_FOUND", `Not found: ${message}`);
        case 413:
            return new RuntimeError("AIRTABLE_REQUEST_TOO_LARGE", message);
        case 422:
            return new RuntimeError("AIRTABLE_INVALID_REQUEST", message);
        case 429:
            return new RuntimeError(
                "AIRTABLE_RATE_LIMITED",
                "Airtable rate limited the token (more than 5 requests per second and base)."
            );
        default:
            if (status >= 500) return new RuntimeError("AIRTABLE_SERVER_ERROR", message);
            return new RuntimeError(`AIRTABLE_API_ERROR_${status}`, message);
    }
}
