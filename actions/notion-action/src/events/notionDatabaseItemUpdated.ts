import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";
import { INTEGRATION_TOKEN_SETTING, POLL_INTERVAL_SETTING } from "../integrationToken.js";
import { DATABASE_ID_SETTING } from "../parameters.js";

@Identifier("NotionDatabaseItemUpdated")
@Name({ code: "en-US", content: "Notion database item updated" })
@Description({ code: "en-US", content: "Poll for page edits in a database, including edits to content. The initial poll establishes a baseline without firing." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Notion database item updated in ${databaseId}" })
@Signature("(integrationToken: string, databaseId: string, pollIntervalSeconds?: number): NOTION_PAGE")
@EventSetting(INTEGRATION_TOKEN_SETTING)
@EventSetting(DATABASE_ID_SETTING)
@EventSetting(POLL_INTERVAL_SETTING)
export class NotionDatabaseItemUpdated {}

