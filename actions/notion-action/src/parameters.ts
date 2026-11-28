/** Shared labels and descriptions, so every Notion node explains IDs the same way. */

const text = (content: string) => [{ code: "en-US", content }];

const DATABASE_ID_HINT = "The ID of the database: the 32-character code in its URL, e.g. notion.so/workspace/<ID>?v=... Share the database with the integration (... > Connections).";
const PAGE_ID_HINT = "The ID of the page: the 32-character code at the end of its URL, or the id of a page from another Notion node. Share the page with the integration.";

/** The page ID parameter of a function. */
export const PAGE_ID_PARAMETER = { runtimeName: "pageId", name: text("Page ID"), description: text(PAGE_ID_HINT) };

/** The parent of a new page: a database or a page. */
export const PARENT_ID_PARAMETER = {
    runtimeName: "parentId",
    name: text("Parent ID"),
    description: text("The ID of a database (the new page becomes an entry) or a page (the new page becomes a subpage): the 32-character code in its URL. Share the parent with the integration (... > Connections)."),
};

/** The database ID setting of every trigger. */
export const DATABASE_ID_SETTING = { identifier: "databaseId", name: text("Database ID"), description: text(DATABASE_ID_HINT), linkedDataTypeIdentifiers: ["TEXT"] };
