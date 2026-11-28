import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import { INTEGRATION_TOKEN_PARAMETER } from "../integrationToken.js";
import { PAGE_ID_PARAMETER } from "../parameters.js";

@Identifier("notionGetPage")
@Name({ code: "en-US", content: "Get Notion page" })
@Description({ code: "en-US", content: "Retrieve a page with its properties and its content as Markdown (in markdown)." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Get Notion page" })
@Signature("(integrationToken: string, pageId: string): NOTION_PAGE")
@Parameter(INTEGRATION_TOKEN_PARAMETER)
@Parameter(PAGE_ID_PARAMETER)
export class NotionGetPageFunction {
    run(_context: FunctionContext, integrationToken: string, pageId: string) {
        return new NotionClient(integrationToken).getPage(pageId);
    }
}

