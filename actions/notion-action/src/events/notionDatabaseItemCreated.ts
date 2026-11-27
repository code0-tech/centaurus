import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";
import { INTEGRATION_TOKEN_SETTING, POLL_INTERVAL_SETTING } from "../integrationToken.js";

@Identifier("NotionDatabaseItemCreated")
@Name({ code: "en-US", content: "Notion database item created" })
@Description({ code: "en-US", content: "Poll for newly created pages in a database. The initial poll establishes a baseline without firing." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Notion database item created in ${databaseId}" })
@Signature("(integrationToken: string, databaseId: string, pollIntervalSeconds?: number): NOTION_PAGE")
@EventSetting(INTEGRATION_TOKEN_SETTING)
@EventSetting({
    identifier: "databaseId",
    name: [{ code: "en-US", content: "Database ID" }],
    description: [{ code: "en-US", content: "Database shared with the Notion integration." }],
    linkedDataTypeIdentifiers: ["TEXT"],
})
@EventSetting(POLL_INTERVAL_SETTING)
export class NotionDatabaseItemCreated {}

