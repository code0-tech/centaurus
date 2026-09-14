import type { FunctionContext, ProjectConfiguration } from "@code0-tech/hercules";
import type { NotionPage } from "../data_types/notionPage.js";

export function config(values: Record<string, string> = { integration_token: "test-token" }, projectId = 1n): ProjectConfiguration {
    return { projectId, configValues: Object.entries(values).map(([identifier, value]) => ({ identifier, value })), findConfig: (key) => values[key] };
}

export function context(values?: Record<string, string>): FunctionContext {
    return { projectId: 1n, executionId: "test", matchedConfig: config(values), executeFlow: async () => null };
}

export function page(id = "page-1", overrides: Partial<NotionPage> = {}): NotionPage {
    return {
        object: "page", id, created_time: "2026-09-01T10:00:00.000Z", last_edited_time: "2026-09-01T10:00:00.000Z",
        archived: false, url: `https://www.notion.so/${id}`, parent: { type: "database_id", database_id: "database-1" },
        icon: null, cover: null, in_trash: false, public_url: null,
        created_by: { object: "user", id: "user-1" }, last_edited_by: { object: "user", id: "user-1" },
        properties: { Done: { id: "done", type: "checkbox", checkbox: false } }, ...overrides,
    };
}

export function list(results: unknown[], next_cursor: string | null = null, type = "page_or_database") {
    return { object: "list", type, [type]: {}, results, has_more: next_cursor !== null, next_cursor };
}
