import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

@Identifier("NotionPagePropertyChanged")
@Name({ code: "en-US", content: "Notion page property changed" })
@Description({ code: "en-US", content: "Poll for changes to one property of existing pages in a database. The initial poll establishes a baseline without firing." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Notion page property changed in ${databaseId}" })
@Signature("(databaseId: string, propertyName: string): NOTION_PAGE")
@EventSetting({
    identifier: "databaseId",
    name: [{ code: "en-US", content: "Database ID" }],
    description: [{ code: "en-US", content: "Database shared with this project's Notion integration." }],
    linkedDataTypeIdentifiers: ["TEXT"],
})
@EventSetting({
    identifier: "propertyName",
    name: [{ code: "en-US", content: "Property name" }],
    description: [{ code: "en-US", content: "Exact name of the property to watch (case-sensitive)." }],
    linkedDataTypeIdentifiers: ["TEXT"],
})
export class NotionPagePropertyChanged {}

