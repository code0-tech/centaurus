import { RuntimeError } from "@code0-tech/hercules";
import { APIResponseError, Client, isNotionClientError, UnknownHTTPResponseError } from "@notionhq/client";
import { z } from "zod";
import { NotionPageSchema } from "./data_types/notionPage.js";
import { NotionQueryResultSchema } from "./data_types/notionQueryResult.js";
import { NotionSearchResultSchema } from "./data_types/notionSearchResult.js";
import type { NotionFilter } from "./data_types/notionFilter.js";
import type { NotionSearchFilter } from "./data_types/notionSearchFilter.js";
import { notionDateFields } from "./generated/notion-schema-order.js";

const DATE_FIELDS = new Set<string>(notionDateFields);

/** An ISO 8601 timestamp as a hercules DATE: Unix microseconds (UTC). */
export function toNotionDate(iso: string): number | string {
    const milliseconds = Date.parse(iso);
    // Unparseable values stay as they are and fail response validation.
    return Number.isNaN(milliseconds) ? iso : milliseconds * 1000;
}

/**
 * Notion sends points in time as ISO 8601 strings, while the response data
 * types declare them as DATE. Converts every known timestamp field in a
 * response before it is validated.
 */
export function withNotionDates(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(withNotionDates);
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
        key,
        DATE_FIELDS.has(key) && typeof entry === "string" ? toNotionDate(entry) : withNotionDates(entry),
    ]));
}

// Only the data source references are needed to resolve a database.
const DatabaseDataSourcesSchema = z.looseObject({ data_sources: z.array(z.looseObject({ id: z.string() })) });
// Only the Markdown text of a page's content is used.
const PageMarkdownSchema = z.looseObject({ markdown: z.string() });
/**
 * The title column of a page, addressed by its ID: Notion gives the title
 * column of every database and page the property ID "title", whatever its name.
 */
function titleProperty(title: string) {
    return { title: { title: title ? [{ type: "text" as const, text: { content: title } }] : [] } };
}

function optionalText(value: unknown, code: string, message: string): string | undefined {
    if (value == null || value === "") return undefined;
    if (typeof value !== "string") throw new RuntimeError(code, message);
    return value;
}

// Request and response shapes differ between Notion versions (e.g. databases
// vs. data sources), so the version is pinned to the one the bundled SDK
// types and our schemas describe rather than being configurable.
export const NOTION_VERSION = "2025-09-03";

/** Validates the integration token a function or trigger was given. */
export function notionCredentials(integrationToken: unknown) {
    if (typeof integrationToken !== "string" || !integrationToken.trim()) {
        throw new RuntimeError("NOTION_MISSING_TOKEN", "No Notion integration token given. Set the integration token to your secret_... or ntn_... token.");
    }
    return { token: integrationToken.trim(), version: NOTION_VERSION };
}

type SdkFilter = Parameters<Client["dataSources"]["query"]>[0]["filter"];
type SdkSorts = NonNullable<Parameters<Client["dataSources"]["query"]>[0]["sorts"]>;

export type SortDirection = "ascending" | "descending";
const SORT_DIRECTIONS: readonly string[] = ["ascending", "descending"];

/**
 * The sort of a database query: by a column (ascending unless given), or
 * without one by creation time (newest first unless given).
 */
export function querySorts(sortProperty?: string | null, sortDirection?: string | null): SdkSorts {
    if (sortDirection != null && sortDirection !== "" && !SORT_DIRECTIONS.includes(sortDirection)) {
        throw new RuntimeError("NOTION_INVALID_SORT", "The sort direction must be ascending or descending.");
    }
    const direction = (sortDirection || undefined) as SortDirection | undefined;
    const property = typeof sortProperty === "string" ? sortProperty.trim() : "";
    return property
        ? [{ property, direction: direction ?? "ascending" }]
        : [{ timestamp: "created_time", direction: direction ?? "descending" }];
}

function notionId(id: string): string {
    if (!id.trim()) throw new RuntimeError("NOTION_INVALID_ID", "A Notion page or database ID is required.");
    // The SDK interpolates IDs into paths without encoding them itself.
    return encodeURIComponent(id.trim());
}

export class NotionClient {
    private readonly sdk: Client;

    constructor(integrationToken: string) {
        const { token, version } = notionCredentials(integrationToken);
        this.sdk = new Client({
            auth: token,
            notionVersion: version,
            timeoutMs: 30_000,
            // Rate limits are retried below with a bounded Retry-After.
            retry: false,
            // Errors are sanitized below rather than logged with request details.
            logger: () => {},
            fetch: (url, init) => fetch(url, { ...init, redirect: "error" }),
        });
    }

    private async request<T>(call: () => Promise<unknown>, schema: z.ZodType<T>): Promise<T> {
        for (let attempt = 0; ; attempt++) {
            try {
                return schema.parse(withNotionDates(await call()));
            } catch (error) {
                if (isNotionClientError(error)) {
                    const response = APIResponseError.isAPIResponseError(error) || UnknownHTTPResponseError.isUnknownHTTPResponseError(error) ? error : undefined;
                    const status = response?.status;
                    const retryAfter = Number(response?.headers instanceof Headers ? response.headers.get("retry-after") ?? 1 : 1);
                    if (status === 429 && attempt < 2 && Number.isFinite(retryAfter) && retryAfter >= 0 && retryAfter <= 60) {
                        await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 1000));
                        continue;
                    }
                    // Never forward raw SDK errors or response bodies into a flow.
                    throw new RuntimeError(status ? `NOTION_HTTP_${status}` : "NOTION_NETWORK_ERROR",
                        status ? `Notion returned HTTP ${status}. Check permissions, IDs and request values.` : "The Notion API request failed or timed out.");
                }
                if (error instanceof z.ZodError) {
                    throw new RuntimeError("NOTION_INVALID_RESPONSE", "Notion returned an unexpected response shape.");
                }
                throw new RuntimeError("NOTION_NETWORK_ERROR", "The Notion API request failed or timed out.");
            }
        }
    }

    /**
     * Creates a page with a title and optional content written as
     * Notion-flavored Markdown (`markdown_version` v2, as v1 is deprecated):
     * an entry if the parent is a database, otherwise a subpage of the parent page.
     */
    async createPage(parentId: string, title: string, markdown?: string | null) {
        if (typeof title !== "string") throw new RuntimeError("NOTION_INVALID_TITLE", "The title must be text.");
        const content = optionalText(markdown, "NOTION_INVALID_MARKDOWN", "Page content must be Markdown text.");
        const parent = await this.resolveParent(parentId);
        return this.request(() => this.sdk.pages.create({
            parent, properties: titleProperty(title.trim()),
            ...(content ? { markdown: content, markdown_version: "v2" as const } : {}),
        }), NotionPageSchema);
    }

    /**
     * Changes the title and/or replaces the whole content of a page with
     * Markdown (v2). Empty values leave the title or content unchanged. Child
     * pages and databases are never deleted: Notion rejects such a replacement.
     */
    async updatePage(pageId: string, title?: string | null, markdown?: string | null) {
        const page_id = notionId(pageId);
        const newTitle = optionalText(title, "NOTION_INVALID_TITLE", "The title must be text.")?.trim();
        const content = optionalText(markdown, "NOTION_INVALID_MARKDOWN", "Page content must be Markdown text.");
        const page = newTitle
            ? await this.request(() => this.sdk.pages.update({ page_id, properties: titleProperty(newTitle) }), NotionPageSchema)
            : await this.request(() => this.sdk.pages.retrieve({ page_id }), NotionPageSchema);
        if (content === undefined) return page;
        const updated = await this.request(() => this.sdk.pages.updateMarkdown({
            page_id, markdown_version: "v2", type: "replace_content", replace_content: { new_str: content },
        }), PageMarkdownSchema);
        return { ...page, markdown: updated.markdown };
    }

    /** Retrieves a page with its properties and its content as Notion-flavored Markdown (v2). */
    async getPage(pageId: string) {
        const page_id = notionId(pageId);
        const [page, content] = await Promise.all([
            this.request(() => this.sdk.pages.retrieve({ page_id }), NotionPageSchema),
            this.request(() => this.sdk.pages.retrieveMarkdown({ page_id, markdown_version: "v2" }), PageMarkdownSchema),
        ]);
        return { ...page, markdown: content.markdown };
    }

    async archivePage(pageId: string): Promise<boolean> {
        const page_id = notionId(pageId);
        const page = await this.request(() => this.sdk.pages.update({ page_id, in_trash: true }), NotionPageSchema);
        return page.in_trash;
    }

    /**
     * Since Notion-Version 2025-09-03 a database is a container of data sources,
     * and pages live in a data source. Flows keep addressing the database, so
     * resolve its single data source; multi-source databases are ambiguous.
     */
    async resolveDataSourceId(databaseId: string): Promise<string> {
        const database_id = notionId(databaseId);
        const database = await this.request(() => this.sdk.databases.retrieve({ database_id }), DatabaseDataSourcesSchema);
        if (database.data_sources.length !== 1) {
            throw new RuntimeError(database.data_sources.length ? "NOTION_MULTIPLE_DATA_SOURCES" : "NOTION_NO_DATA_SOURCE",
                database.data_sources.length
                    ? "The Notion database has several data sources. Use a database with a single data source."
                    : "The Notion database has no data source the integration can access.");
        }
        // Raw ID: callers encode it for paths, request bodies take it as is.
        return database.data_sources[0].id;
    }

    /**
     * The parent of a new page: the data source of a database, or else a page.
     * Notion answers the database lookup of a page ID with 400 (a page, not a
     * database) or 404, so those fall back to the page; if the ID is no
     * accessible page either, creating the page fails with Notion's error.
     */
    private async resolveParent(parentId: string): Promise<{ data_source_id: string } | { page_id: string }> {
        try {
            return { data_source_id: await this.resolveDataSourceId(parentId) };
        } catch (error) {
            if (error instanceof RuntimeError && (error.code === "NOTION_HTTP_400" || error.code === "NOTION_HTTP_404")) {
                return { page_id: parentId.trim() };
            }
            throw error;
        }
    }

    /** Queries a database's matching entries, sorted as described by querySorts. */
    async queryDatabase(databaseId: string, filter?: NotionFilter | null, sortProperty?: string | null, sortDirection?: string | null) {
        const sorts = querySorts(sortProperty, sortDirection);
        return this.queryDataSource(await this.resolveDataSourceId(databaseId), filter, sorts);
    }

    queryDataSource(dataSourceId: string, filter?: NotionFilter | null, sorts?: SdkSorts | null) {
        const data_source_id = notionId(dataSourceId);
        return this.paginate((start_cursor) => this.request(() => this.sdk.dataSources.query({
            data_source_id,
            page_size: 100, ...(filter == null ? {} : { filter: filter as SdkFilter }), ...(sorts == null ? {} : { sorts }),
            ...(start_cursor ? { start_cursor } : {}),
        }), NotionQueryResultSchema));
    }

    search(query: string, filter?: NotionSearchFilter | null) {
        return this.paginate((start_cursor) => this.request(() => this.sdk.search({
            query, page_size: 100, ...(filter == null ? {} : { filter }), ...(start_cursor ? { start_cursor } : {}),
        }), NotionSearchResultSchema));
    }

    private async paginate<T extends { results: unknown[]; has_more: boolean; next_cursor: string | null }>(fetchPage: (cursor?: string) => Promise<T>): Promise<T> {
        const first = await fetchPage();
        const results = [...first.results];
        const cursors = new Set<string>();
        let page = first;
        while (page.has_more) {
            if (!page.next_cursor || cursors.has(page.next_cursor)) {
                throw new RuntimeError("NOTION_INVALID_CURSOR", "Notion returned a missing or repeated pagination cursor.");
            }
            cursors.add(page.next_cursor);
            page = await fetchPage(page.next_cursor);
            results.push(...page.results);
        }
        return { ...first, results, has_more: false, next_cursor: null };
    }
}
