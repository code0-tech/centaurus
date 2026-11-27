import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import { INTEGRATION_TOKEN_PARAMETER } from "../integrationToken.js";


@Identifier("notionGetPage")
@Name({ code: "en-US", content: "Get Notion page" })
@Description({ code: "en-US", content: "Retrieve a page and its properties (not its block children)." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Get Notion page" })
@Signature("(integrationToken: string, pageId: string): NOTION_PAGE")
@Parameter(INTEGRATION_TOKEN_PARAMETER)
@Parameter({ runtimeName: "pageId", name: [{ code: "en-US", content: "pageId" }], description: [{ code: "en-US", content: "Page ID" }] })
export class NotionGetPageFunction {
    run(_context: FunctionContext, integrationToken: string, pageId: string) {
        return new NotionClient(integrationToken).getPage(pageId);
    }
}

