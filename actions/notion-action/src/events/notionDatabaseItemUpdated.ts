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

/** Trigger identifier used to match flows watching a database for edited pages. */
export const NOTION_DATABASE_ITEM_UPDATED = "NotionDatabaseItemUpdated";

/**
 * Fires when a page in a watched Notion database is edited. The edited page is
 * passed to the flow as its input. Delivered by polling, see poller.ts.
 */
@Identifier(NOTION_DATABASE_ITEM_UPDATED)
@Signature("(databaseId: TEXT): NOTION_PAGE")
@Name({ code: "en-US", content: "Notion database item updated" })
@Description({ code: "en-US", content: "Runs when a page in a watched Notion database is edited." })
@Documentation({
    code: "en-US",
    content:
        "Polls the configured Notion database and runs the flow for every page whose last edited time advanced since the previous poll, passing the edited page as the flow input.",
})
@DisplayMessage({ code: "en-US", content: "On item updated in database ${databaseId}" })
@Alias({ code: "en-US", content: "notion;database;updated;edited;item;page;trigger" })
@DisplayIcon("tabler:database-edit")
@EventSetting({
    identifier: "databaseId",
    name: [{ code: "en-US", content: "Database ID" }],
    description: [{ code: "en-US", content: "The ID of the database to watch for edited pages." }],
    linkedDataTypeIdentifiers: ["TEXT"],
})
export class NotionDatabaseItemUpdatedEvent {}
