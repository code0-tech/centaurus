import { RuntimeError, type ProjectConfiguration } from "@code0-tech/hercules";
import { APIResponseError, Client, isNotionClientError, UnknownHTTPResponseError } from "@notionhq/client";
import { z } from "zod";
import { NotionPageSchema } from "./data_types/notionPage.js";
import { NotionQueryResultSchema } from "./data_types/notionQueryResult.js";
import { NotionSearchResultSchema } from "./data_types/notionSearchResult.js";
import { NotionBlockListSchema } from "./data_types/notionBlockList.js";
import type { NotionProperties } from "./data_types/notionProperties.js";
import type { NotionBlock } from "./data_types/notionBlock.js";
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
const DatabaseDataSourcesSchema = z.object({ data_sources: z.array(z.object({ id: z.string() }).passthrough()) }).passthrough();

export const NOTION_VERSION = "2025-09-03";

export function notionCredentials(config: Pick<ProjectConfiguration, "findConfig">) {
    const token = config.findConfig("integration_token") ?? process.env.NOTION_INTEGRATION_TOKEN;
    const version = config.findConfig("notion_version") || NOTION_VERSION;
    if (typeof token !== "string" || !token.trim()) {
        throw new RuntimeError("NOTION_MISSING_TOKEN", "Configure integration_token or NOTION_INTEGRATION_TOKEN.");
    }
    // Request and response shapes differ between Notion versions (e.g. databases
    // vs. data sources). Only send the version the bundled SDK types describe.
    if (version !== NOTION_VERSION) {
        throw new RuntimeError("NOTION_UNSUPPORTED_VERSION", `This action supports Notion-Version ${NOTION_VERSION}.`);
    }
    return { token: token.trim(), version };
}

function notionId(id: string): string {
    if (!id.trim()) throw new RuntimeError("NOTION_INVALID_ID", "A Notion page or database ID is required.");
    // The SDK interpolates IDs into paths without encoding them itself.
    return encodeURIComponent(id.trim());
}

export class NotionClient {
    private readonly sdk: Client;

    constructor(config: Pick<ProjectConfiguration, "findConfig">) {
        const { token, version } = notionCredentials(config);
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

    async createPage(parentDatabaseId: string, properties: NotionProperties, children?: NotionBlock[]) {
        this.validateChildren(children);
        const data_source_id = await this.resolveDataSourceId(parentDatabaseId);
        return this.request(() => this.sdk.pages.create({
            parent: { data_source_id }, properties, ...(children === undefined ? {} : { children }),
        }), NotionPageSchema);
    }

    updatePage(pageId: string, properties: NotionProperties) {
        const page_id = notionId(pageId);
        return this.request(() => this.sdk.pages.update({ page_id, properties }), NotionPageSchema);
    }

    getPage(pageId: string) {
        const page_id = notionId(pageId);
        return this.request(() => this.sdk.pages.retrieve({ page_id }), NotionPageSchema);
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

    async queryDatabase(databaseId: string, filter?: NotionFilter, sorts?: NotionSort[]) {
        return this.queryDataSource(await this.resolveDataSourceId(databaseId), filter, sorts);
    }

    queryDataSource(dataSourceId: string, filter?: NotionFilter, sorts?: NotionSort[]) {
        const data_source_id = notionId(dataSourceId);
        return this.paginate((start_cursor) => this.request(() => this.sdk.dataSources.query({
            data_source_id,
            page_size: 100, ...(filter === undefined ? {} : { filter }), ...(sorts === undefined ? {} : { sorts }),
            ...(start_cursor ? { start_cursor } : {}),
        }), NotionQueryResultSchema));
    }

    appendBlocks(pageId: string, children: NotionBlock[]) {
        this.validateChildren(children);
        if (!children.length) throw new RuntimeError("NOTION_INVALID_CHILDREN", "Provide at least one block.");
        const block_id = notionId(pageId);
        return this.request(() => this.sdk.blocks.children.append({ block_id, children }), NotionBlockListSchema);
    }

    search(query: string, filter?: NotionSearchFilter) {
        return this.paginate((start_cursor) => this.request(() => this.sdk.search({
            query, page_size: 100, ...(filter === undefined ? {} : { filter }), ...(start_cursor ? { start_cursor } : {}),
        }), NotionSearchResultSchema));
    }

    private validateChildren(children?: NotionBlock[]) {
        if (children && children.length > 100) {
            throw new RuntimeError("NOTION_INVALID_CHILDREN", "A single request supports at most 100 top-level blocks.");
        }
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
