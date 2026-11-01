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

/** Trigger identifier used to match flows watching a property for value changes. */
export const NOTION_PAGE_PROPERTY_CHANGED = "NotionPagePropertyChanged";

/**
 * Fires when a watched property of a page in a watched database changes value.
 * The affected page is passed to the flow as its input. Delivered by polling,
 * see poller.ts.
 */
@Identifier(NOTION_PAGE_PROPERTY_CHANGED)
@Signature("(databaseId: TEXT, propertyName: TEXT): NOTION_PAGE")
@Name({ code: "en-US", content: "Notion page property changed" })
@Description({ code: "en-US", content: "Runs when a watched property of a page changes value." })
@Documentation({
    code: "en-US",
    content:
        "Polls the configured Notion database and runs the flow whenever the watched property of a page changes value since the previous poll, passing the affected page as the flow input.",
})
@DisplayMessage({ code: "en-US", content: "On property ${propertyName} changed in database ${databaseId}" })
@Alias({ code: "en-US", content: "notion;property;changed;status;field;page;trigger" })
@DisplayIcon("tabler:database-cog")
@EventSetting({
    identifier: "databaseId",
    name: [{ code: "en-US", content: "Database ID" }],
    description: [{ code: "en-US", content: "The ID of the database whose pages are watched." }],
    linkedDataTypeIdentifiers: ["TEXT"],
})
@EventSetting({
    identifier: "propertyName",
    name: [{ code: "en-US", content: "Property name" }],
    description: [{ code: "en-US", content: "The name of the property to watch for value changes." }],
    linkedDataTypeIdentifiers: ["TEXT"],
})
export class NotionPagePropertyChangedEvent {}
