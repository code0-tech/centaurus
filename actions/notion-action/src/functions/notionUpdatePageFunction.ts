import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import { INTEGRATION_TOKEN_PARAMETER } from "../integrationToken.js";
import { PAGE_ID_PARAMETER } from "../parameters.js";

@Identifier("notionUpdatePage")
@Name({ code: "en-US", content: "Update Notion page" })
@Description({ code: "en-US", content: "Change the title and/or replace the content of a page. Empty fields stay unchanged." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Update Notion page" })
@Signature("(integrationToken: string, pageId: string, title?: string, markdown?: string): NOTION_PAGE")
@Parameter(INTEGRATION_TOKEN_PARAMETER)
@Parameter(PAGE_ID_PARAMETER)
@Parameter({ runtimeName: "title", name: [{ code: "en-US", content: "Title" }], description: [{ code: "en-US", content: "New title of the page. Leave empty to keep the current title." }], optional: true })
@Parameter({ runtimeName: "markdown", name: [{ code: "en-US", content: "Content (Markdown)" }], description: [{ code: "en-US", content: "New page content as Markdown; replaces the entire current content. Leave empty to keep the current content. Child pages and databases are kept: Notion rejects content that would delete them." }], optional: true })
export class NotionUpdatePageFunction {
    run(_context: FunctionContext, integrationToken: string, pageId: string, title?: string | null, markdown?: string | null) {
        return new NotionClient(integrationToken).updatePage(pageId, title, markdown);
    }
}
