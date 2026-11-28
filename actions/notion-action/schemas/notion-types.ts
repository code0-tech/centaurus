// Source aliases only: every API shape comes from the pinned official SDK.
// These aliases are converted into OpenAPI components before Zod generation.
import type {
    CreatePageParameters, DatabaseObjectResponse, PageObjectResponse,
    QueryDataSourceResponse, SearchResponse,
    UserObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";

export type NotionPage = PageObjectResponse;
export type NotionDatabase = DatabaseObjectResponse;
export type NotionUser = UserObjectResponse;
export type NotionQueryResult = QueryDataSourceResponse;
export type NotionSearchResult = SearchResponse;
export type NotionProperties = NonNullable<CreatePageParameters["properties"]>;
export type NotionPropertyValue = NotionProperties[string];
export type NotionRichText = Extract<NotionPropertyValue, { rich_text: unknown }>["rich_text"][number];
