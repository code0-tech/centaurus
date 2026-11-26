import type { FunctionContext, ProjectConfiguration } from "@code0-tech/hercules";
import { withNotionDates } from "../client.js";
import type { NotionPage } from "../data_types/notionPage.js";

/** A page as the Notion API sends it: timestamps are ISO 8601 strings. */
type ApiPage = Omit<NotionPage, "created_time" | "last_edited_time"> & { created_time: string; last_edited_time: string };

/** The integration token the tests call Notion with. */
export const TOKEN = "test-token";

export function config(values: Record<string, string | number> = {}, projectId = 1n): ProjectConfiguration {
    return { projectId, configValues: Object.entries(values).map(([identifier, value]) => ({ identifier, value })), findConfig: (key) => values[key] };
}

export function context(values?: Record<string, string>): FunctionContext {
    return { projectId: 1n, executionId: "test", matchedConfig: config(values), executeFlow: async () => null };
}

export function page(id = "page-1", overrides: Partial<ApiPage> = {}): ApiPage {
    return {
        object: "page", id, created_time: "2026-09-01T10:00:00.000Z", last_edited_time: "2026-09-01T10:00:00.000Z",
        archived: false, url: `https://www.notion.so/${id}`, parent: { type: "database_id", database_id: "database-1" },
        icon: null, cover: null, in_trash: false, public_url: null,
        created_by: { object: "user", id: "user-1" }, last_edited_by: { object: "user", id: "user-1" },
        properties: { Done: { id: "done", type: "checkbox", checkbox: false } }, ...overrides,
    };
}

export function list(results: unknown[], next_cursor: string | null = null, type = "page_or_data_source") {
    return { object: "list", type, [type]: {}, results, has_more: next_cursor !== null, next_cursor };
}

/** What the action hands to flows for an API response: timestamps as DATE values. */
export function parsed<T>(response: T): T {
    return withNotionDates(response) as T;
}
