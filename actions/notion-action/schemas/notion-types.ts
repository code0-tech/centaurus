// Source aliases only: every API shape comes from the pinned official SDK.
// These aliases are converted into OpenAPI components before Zod generation.
import type {
    AppendBlockChildrenParameters, AppendBlockChildrenResponse,
    CreatePageParameters, DatabaseObjectResponse, PageObjectResponse,
    QueryDatabaseParameters, QueryDatabaseResponse, SearchParameters, SearchResponse,
    UserObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";

export type NotionPage = PageObjectResponse;
export type NotionDatabase = DatabaseObjectResponse;
export type NotionUser = UserObjectResponse;
export type NotionBlock = AppendBlockChildrenParameters["children"][number];
export type NotionBlockList = AppendBlockChildrenResponse;
export type NotionQueryResult = QueryDatabaseResponse;
export type NotionSearchResult = SearchResponse;
export type NotionProperties = NonNullable<CreatePageParameters["properties"]>;
export type NotionPropertyValue = NotionProperties[string];
export type NotionRichText = Extract<NotionPropertyValue, { rich_text: unknown }>["rich_text"][number];
export type NotionFilter = NonNullable<QueryDatabaseParameters["filter"]>;
export type NotionSort = NonNullable<QueryDatabaseParameters["sorts"]>[number];
export type NotionSearchFilter = NonNullable<SearchParameters["filter"]>;
