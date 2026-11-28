import { RuntimeError } from "@code0-tech/hercules";
import { APIResponseError, Client, isNotionClientError, UnknownHTTPResponseError } from "@notionhq/client";
import { z } from "zod";
import { NotionPageSchema } from "./data_types/notionPage.js";
import { NotionQueryResultSchema } from "./data_types/notionQueryResult.js";
import { NotionSearchResultSchema } from "./data_types/notionSearchResult.js";
import { toNotionProperties } from "./functions/utils/propertyValue.js";
import type { NotionFilter } from "./data_types/notionFilter.js";
import type { NotionSort } from "./data_types/notionSort.js";
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
// Only the column types are needed to convert plain property values.
const ColumnTypesSchema = z.looseObject({ properties: z.record(z.string(), z.looseObject({ type: z.string() })) });
type SdkProperties = Parameters<Client["pages"]["create"]>[0]["properties"];

function columnTypes(schema: z.infer<typeof ColumnTypesSchema>): Record<string, string> {
    return Object.fromEntries(Object.entries(schema.properties).map(([name, column]) => [name, column.type]));
}

function hasValues(properties: unknown): boolean {
    return typeof properties === "object" && properties !== null && !Array.isArray(properties) && Object.keys(properties).length > 0;
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

/** Query results without a sort come newest first. */
export const DEFAULT_QUERY_SORTS: SdkSorts = [{ timestamp: "created_time", direction: "descending" }];

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
     * Creates a page with optional content written as Notion-flavored Markdown
     * (`markdown_version` v2, as v1 is deprecated). Empty content is omitted.
     */
    /**
     * Creates a page from plain column values ({ "Name": "Task", "Done": true }),
     * converted using the column types of the database's data source, with
     * optional content written as Notion-flavored Markdown (`markdown_version`
     * v2, as v1 is deprecated). Empty content is omitted.
     */
    async createPage(parentDatabaseId: string, properties: unknown, markdown?: string | null) {
        if (markdown != null && typeof markdown !== "string") {
            throw new RuntimeError("NOTION_INVALID_MARKDOWN", "Page content must be Markdown text.");
        }
        const data_source_id = await this.resolveDataSourceId(parentDatabaseId);
        const values = properties ?? {};
        const columns = hasValues(values)
            ? columnTypes(await this.request(() => this.sdk.dataSources.retrieve({ data_source_id }), ColumnTypesSchema))
            : {};
        const notionProperties = toNotionProperties(values, columns) as SdkProperties;
        return this.request(() => this.sdk.pages.create({
            parent: { data_source_id }, properties: notionProperties, ...(markdown ? { markdown, markdown_version: "v2" as const } : {}),
        }), NotionPageSchema);
    }

    /** Updates the given columns of a page; values are converted using the page's column types. */
    async updatePage(pageId: string, properties: unknown) {
        const page_id = notionId(pageId);
        const columns = hasValues(properties)
            ? columnTypes(await this.request(() => this.sdk.pages.retrieve({ page_id }), ColumnTypesSchema))
            : {};
        const notionProperties = toNotionProperties(properties, columns) as SdkProperties;
        return this.request(() => this.sdk.pages.update({ page_id, properties: notionProperties }), NotionPageSchema);
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

    /** Queries a database's matching entries sorted by a column, or newest first (by created_time). */
    async queryDatabase(databaseId: string, filter?: NotionFilter | null, sort?: NotionSort | null) {
        return this.queryDataSource(await this.resolveDataSourceId(databaseId), filter, sort == null ? DEFAULT_QUERY_SORTS : [sort]);
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
