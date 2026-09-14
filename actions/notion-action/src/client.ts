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

export const NOTION_VERSION = "2022-06-28";

export function notionCredentials(config: Pick<ProjectConfiguration, "findConfig">) {
    const token = config.findConfig("integration_token") ?? process.env.NOTION_INTEGRATION_TOKEN;
    const version = config.findConfig("notion_version") || NOTION_VERSION;
    if (typeof token !== "string" || !token.trim()) {
        throw new RuntimeError("NOTION_MISSING_TOKEN", "Configure integration_token or NOTION_INTEGRATION_TOKEN.");
    }
    // Newer versions replace database queries with data-source queries. Do not
    // silently send a legacy request with an incompatible version header.
    if (version !== NOTION_VERSION) {
        throw new RuntimeError("NOTION_UNSUPPORTED_VERSION", `This action supports Notion-Version ${NOTION_VERSION}.`);
    }
    return { token: token.trim(), version };
}

function notionId(id: string): string {
    if (!id.trim()) throw new RuntimeError("NOTION_INVALID_ID", "A Notion page or database ID is required.");
    // SDK v4 interpolates IDs into paths without encoding them itself.
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
            // Errors are sanitized below rather than logged with request details.
            logger: () => {},
            fetch: (url, init) => fetch(url, { ...init, redirect: "error" }),
        });
    }

    private async request<T>(call: () => Promise<unknown>, schema: z.ZodType<T>): Promise<T> {
        for (let attempt = 0; ; attempt++) {
            try {
                return schema.parse(await call());
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

    createPage(parentDatabaseId: string, properties: NotionProperties, children?: NotionBlock[]) {
        this.validateChildren(children);
        const database_id = notionId(parentDatabaseId);
        return this.request(() => this.sdk.pages.create({
            parent: { database_id }, properties, ...(children === undefined ? {} : { children }),
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
        const page = await this.request(() => this.sdk.pages.update({ page_id, archived: true }), NotionPageSchema);
        return page.archived;
    }

    async queryDatabase(databaseId: string, filter?: NotionFilter, sorts?: NotionSort[]) {
        const database_id = notionId(databaseId);
        return this.paginate((start_cursor) => this.request(() => this.sdk.databases.query({
            database_id,
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
