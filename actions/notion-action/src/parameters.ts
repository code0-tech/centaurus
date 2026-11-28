/** Shared labels and descriptions, so every Notion node explains IDs the same way. */

const text = (content: string) => [{ code: "en-US", content }];

const DATABASE_ID_HINT = "The ID of the database: the 32-character code in its URL, e.g. notion.so/workspace/<ID>?v=... Share the database with the integration (... > Connections).";
const PAGE_ID_HINT = "The ID of the page: the 32-character code at the end of its URL, or the id of a page from another Notion node. Share the page with the integration.";

/** A database ID parameter of a function. */
export const databaseIdParameter = (runtimeName: string) => ({ runtimeName, name: text("Database ID"), description: text(DATABASE_ID_HINT) });

/** The page ID parameter of a function. */
export const PAGE_ID_PARAMETER = { runtimeName: "pageId", name: text("Page ID"), description: text(PAGE_ID_HINT) };

/** The database ID setting of every trigger. */
export const DATABASE_ID_SETTING = { identifier: "databaseId", name: text("Database ID"), description: text(DATABASE_ID_HINT), linkedDataTypeIdentifiers: ["TEXT"] };
