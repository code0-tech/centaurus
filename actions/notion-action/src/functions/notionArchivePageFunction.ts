import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import { INTEGRATION_TOKEN_PARAMETER } from "../integrationToken.js";
import { PAGE_ID_PARAMETER } from "../parameters.js";


@Identifier("notionArchivePage")
@Name({ code: "en-US", content: "Archive Notion page" })
@Description({ code: "en-US", content: "Archive a page; returns whether Notion confirmed it is archived." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Archive Notion page" })
@Signature("(integrationToken: string, pageId: string): boolean")
@Parameter(INTEGRATION_TOKEN_PARAMETER)
@Parameter(PAGE_ID_PARAMETER)
export class NotionArchivePageFunction {
    run(_context: FunctionContext, integrationToken: string, pageId: string) {
        return new NotionClient(integrationToken).archivePage(pageId);
    }
}

