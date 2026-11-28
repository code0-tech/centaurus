import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import { INTEGRATION_TOKEN_PARAMETER } from "../integrationToken.js";
import { PAGE_ID_PARAMETER } from "../parameters.js";

@Identifier("notionUpdatePage")
@Name({ code: "en-US", content: "Update Notion page" })
@Description({ code: "en-US", content: "Update the supplied page properties; other properties remain unchanged." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Update Notion page" })
@Signature("(integrationToken: string, pageId: string, properties: OBJECT<{ [key: string]: any }>): NOTION_PAGE")
@Parameter(INTEGRATION_TOKEN_PARAMETER)
@Parameter(PAGE_ID_PARAMETER)
@Parameter({ runtimeName: "properties", name: [{ code: "en-US", content: "Properties" }], description: [{ code: "en-US", content: "Columns to change as an object, e.g. { \"Status\": \"Done\", \"Due\": null }. Other columns stay unchanged; null clears a column." }] })
export class NotionUpdatePageFunction {
    run(_context: FunctionContext, integrationToken: string, pageId: string, properties: Record<string, unknown>) {
        return new NotionClient(integrationToken).updatePage(pageId, properties);
    }
}

