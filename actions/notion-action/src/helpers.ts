import { FunctionContext, RuntimeError } from "@code0-tech/hercules";
import { z } from "zod";
import { NotionPage, NotionPageSchema } from "./data_types/notionPage.js";
import { NotionBlockList, NotionBlockListSchema } from "./data_types/notionBlockList.js";
import { NotionQueryResult, NotionQueryResultSchema } from "./data_types/notionQueryResult.js";
import { NotionSearchResult, NotionSearchResultSchema } from "./data_types/notionSearchResult.js";

export const NOTION_API_BASE = "https://api.notion.com/v1";
export const NOTION_DEFAULT_VERSION = "2022-06-28";

export interface NotionCredentials {
    token: string;
    version: string;
}

/**
 * Resolves the Notion integration token and API version from the matched action
 * config.
 */
export function getNotionCredentials(context: FunctionContext): NotionCredentials {
    const token = context.matchedConfig.findConfig("integration_token") as string | undefined;
    if (!token) {
        throw new RuntimeError(
            "MISSING_NOTION_TOKEN",
            "A Notion integration_token must be configured for this action."
        );
    }
    const version =
        (context.matchedConfig.findConfig("notion_version") as string | undefined) || NOTION_DEFAULT_VERSION;
    return { token, version };
}

/**
 * Performs an authenticated request against the Notion API and returns the
 * parsed JSON body. Non-2xx responses are surfaced as RuntimeErrors carrying
 * Notion's error message. See https://developers.notion.com/reference/intro
 */
export async function notionRequest<T = unknown>(
    credentials: NotionCredentials,
    method: string,
    path: string,
    body?: unknown
): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${NOTION_API_BASE}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${credentials.token}`,
                "Notion-Version": credentials.version,
                "Content-Type": "application/json",
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch (error) {
        throw new RuntimeError(
            "NOTION_REQUEST_FAILED",
            error instanceof Error ? error.message : "Failed to reach the Notion API."
        );
    }

    const text = await response.text();
    let json: any = {};
    if (text) {
        try {
            json = JSON.parse(text);
        } catch {
            json = {};
        }
    }

    if (!response.ok) {
        const message = json?.message ?? response.statusText;
        throw new RuntimeError("NOTION_API_ERROR", `Notion API error ${response.status}: ${message}`);
    }

    return json as T;
}

export const CreatePageRequestSchema = z.object({
    parentDatabaseId: z.string(),
    properties: z.record(z.string(), z.any()),
    children: z.array(z.record(z.string(), z.any())).optional(),
});
export type CreatePageRequest = z.infer<typeof CreatePageRequestSchema>;

export const createPage = async (data: CreatePageRequest, context: FunctionContext): Promise<NotionPage> => {
    const parsed = CreatePageRequestSchema.parse(data);
    const credentials = getNotionCredentials(context);
    const body = {
        parent: { database_id: parsed.parentDatabaseId },
        properties: parsed.properties,
        ...(parsed.children ? { children: parsed.children } : {}),
    };
    const json = await notionRequest(credentials, "POST", "/pages", body);
    return NotionPageSchema.parse(json);
};

export const UpdatePageRequestSchema = z.object({
    pageId: z.string(),
    properties: z.record(z.string(), z.any()),
});
export type UpdatePageRequest = z.infer<typeof UpdatePageRequestSchema>;

export const updatePage = async (data: UpdatePageRequest, context: FunctionContext): Promise<NotionPage> => {
    const parsed = UpdatePageRequestSchema.parse(data);
    const credentials = getNotionCredentials(context);
    const json = await notionRequest(credentials, "PATCH", `/pages/${parsed.pageId}`, {
        properties: parsed.properties,
    });
    return NotionPageSchema.parse(json);
};

export const getPage = async (pageId: string, context: FunctionContext): Promise<NotionPage> => {
    const credentials = getNotionCredentials(context);
    const json = await notionRequest(credentials, "GET", `/pages/${pageId}`);
    return NotionPageSchema.parse(json);
};

export const archivePage = async (pageId: string, context: FunctionContext): Promise<boolean> => {
    const credentials = getNotionCredentials(context);
    await notionRequest(credentials, "PATCH", `/pages/${pageId}`, { archived: true });
    return true;
};

export const QueryDatabaseRequestSchema = z.object({
    databaseId: z.string(),
    filter: z.record(z.string(), z.any()).optional(),
    sorts: z.array(z.record(z.string(), z.any())).optional(),
});
export type QueryDatabaseRequest = z.infer<typeof QueryDatabaseRequestSchema>;

export const queryDatabase = async (
    data: QueryDatabaseRequest,
    context: FunctionContext
): Promise<NotionQueryResult> => {
    const parsed = QueryDatabaseRequestSchema.parse(data);
    const credentials = getNotionCredentials(context);
    const body = {
        ...(parsed.filter ? { filter: parsed.filter } : {}),
        ...(parsed.sorts ? { sorts: parsed.sorts } : {}),
    };
    const json = await notionRequest(credentials, "POST", `/databases/${parsed.databaseId}/query`, body);
    return NotionQueryResultSchema.parse(json);
};

export const AppendBlocksRequestSchema = z.object({
    pageId: z.string(),
    children: z.array(z.record(z.string(), z.any())),
});
export type AppendBlocksRequest = z.infer<typeof AppendBlocksRequestSchema>;

export const appendBlocks = async (
    data: AppendBlocksRequest,
    context: FunctionContext
): Promise<NotionBlockList> => {
    const parsed = AppendBlocksRequestSchema.parse(data);
    const credentials = getNotionCredentials(context);
    const json = await notionRequest(credentials, "PATCH", `/blocks/${parsed.pageId}/children`, {
        children: parsed.children,
    });
    return NotionBlockListSchema.parse(json);
};

export const SearchRequestSchema = z.object({
    query: z.string(),
    filter: z.record(z.string(), z.any()).optional(),
});
export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export const search = async (data: SearchRequest, context: FunctionContext): Promise<NotionSearchResult> => {
    const parsed = SearchRequestSchema.parse(data);
    const credentials = getNotionCredentials(context);
    const body = {
        query: parsed.query,
        ...(parsed.filter ? { filter: parsed.filter } : {}),
    };
    const json = await notionRequest(credentials, "POST", "/search", body);
    return NotionSearchResultSchema.parse(json);
};
