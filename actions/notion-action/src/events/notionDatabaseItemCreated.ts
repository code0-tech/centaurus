import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

@Identifier("NotionDatabaseItemCreated")
@Name({ code: "en-US", content: "Notion database item created" })
@Description({ code: "en-US", content: "Poll for newly created pages in a database. The initial poll establishes a baseline without firing." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Notion database item created in ${databaseId}" })
@Signature("(databaseId: string): NOTION_PAGE")
@EventSetting({
    identifier: "databaseId",
    name: [{ code: "en-US", content: "Database ID" }],
    description: [{ code: "en-US", content: "Database shared with this project's Notion integration." }],
    linkedDataTypeIdentifiers: ["TEXT"],
})
export class NotionDatabaseItemCreated {}

