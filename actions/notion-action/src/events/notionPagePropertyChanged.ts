import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";
import { INTEGRATION_TOKEN_SETTING, POLL_INTERVAL_SETTING } from "../integrationToken.js";
import { DATABASE_ID_SETTING } from "../parameters.js";

@Identifier("NotionPagePropertyChanged")
@Name({ code: "en-US", content: "Notion page property changed" })
@Description({ code: "en-US", content: "Poll for changes to one property of existing pages in a database. The initial poll establishes a baseline without firing." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Notion page property changed in ${databaseId}" })
@Signature("(integrationToken: string, databaseId: string, propertyName: string, pollIntervalSeconds?: number): NOTION_PAGE")
@EventSetting(INTEGRATION_TOKEN_SETTING)
@EventSetting(DATABASE_ID_SETTING)
@EventSetting({
    identifier: "propertyName",
    name: [{ code: "en-US", content: "Property name" }],
    description: [{ code: "en-US", content: "Exact name of the property to watch (case-sensitive)." }],
    linkedDataTypeIdentifiers: ["TEXT"],
})
@EventSetting(POLL_INTERVAL_SETTING)
export class NotionPagePropertyChanged {}

