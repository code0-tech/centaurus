import {
    Alias,
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    EventSetting,
    Identifier,
    Name,
    Signature,
} from "@code0-tech/hercules";

/** Trigger identifier used to match flows watching a database for new pages. */
export const NOTION_DATABASE_ITEM_CREATED = "NotionDatabaseItemCreated";

/**
 * Fires when a new page appears in a watched Notion database. The created page
 * is passed to the flow as its input. Delivered by polling, see poller.ts.
 */
@Identifier(NOTION_DATABASE_ITEM_CREATED)
@Signature("(databaseId: TEXT): NOTION_PAGE")
@Name({ code: "en-US", content: "Notion database item created" })
@Description({ code: "en-US", content: "Runs when a new page is created in a watched Notion database." })
@Documentation({
    code: "en-US",
    content:
        "Polls the configured Notion database and runs the flow for every page created since the previous poll, passing the new page as the flow input.",
})
@DisplayMessage({ code: "en-US", content: "On new item in database ${databaseId}" })
@Alias({ code: "en-US", content: "notion;database;created;new;item;page;trigger" })
@DisplayIcon("tabler:database-plus")
@EventSetting({
    identifier: "databaseId",
    name: [{ code: "en-US", content: "Database ID" }],
    description: [{ code: "en-US", content: "The ID of the database to watch for newly created pages." }],
    linkedDataTypeIdentifiers: ["TEXT"],
})
export class NotionDatabaseItemCreatedEvent {}
