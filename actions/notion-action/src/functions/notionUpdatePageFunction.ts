import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import { INTEGRATION_TOKEN_PARAMETER } from "../data_types/notionIntegrationToken.js";
import type { NotionProperties } from "../data_types/notionProperties.js";

@Identifier("notionUpdatePage")
@Name({ code: "en-US", content: "Update Notion page" })
@Description({ code: "en-US", content: "Update the supplied page properties; other properties remain unchanged." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Update Notion page" })
@Signature("(integrationToken: NOTION_INTEGRATION_TOKEN, pageId: string, properties: NOTION_PROPERTIES): NOTION_PAGE")
@Parameter(INTEGRATION_TOKEN_PARAMETER)
@Parameter({ runtimeName: "pageId", name: [{ code: "en-US", content: "pageId" }], description: [{ code: "en-US", content: "Page ID" }] })
@Parameter({ runtimeName: "properties", name: [{ code: "en-US", content: "properties" }], description: [{ code: "en-US", content: "Properties to update" }] })
export class NotionUpdatePageFunction {
    run(_context: FunctionContext, integrationToken: string, pageId: string, properties: NotionProperties) {
        return new NotionClient(integrationToken).updatePage(pageId, properties);
    }
}

