import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import { INTEGRATION_TOKEN_PARAMETER } from "../integrationToken.js";
import { PARENT_ID_PARAMETER } from "../parameters.js";

@Identifier("notionCreatePage")
@Name({ code: "en-US", content: "Create Notion page" })
@Description({ code: "en-US", content: "Create an entry in a Notion database or a subpage of a Notion page, with a title and optional content written as Markdown." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Create Notion page" })
@Signature("(integrationToken: string, parentId: string, title: string, markdown?: string): NOTION_PAGE")
@Parameter(INTEGRATION_TOKEN_PARAMETER)
@Parameter(PARENT_ID_PARAMETER)
@Parameter({ runtimeName: "title", name: [{ code: "en-US", content: "Title" }], description: [{ code: "en-US", content: "Title of the new page, written to the title column (usually Name) when the parent is a database." }] })
@Parameter({ runtimeName: "markdown", name: [{ code: "en-US", content: "Content (Markdown)" }], description: [{ code: "en-US", content: "Optional page content as Markdown, e.g. headings, lists, to-dos (- [ ]), code blocks and links." }], optional: true })
export class NotionCreatePageFunction {
    run(_context: FunctionContext, integrationToken: string, parentId: string, title: string, markdown?: string | null) {
        return new NotionClient(integrationToken).createPage(parentId, title, markdown);
    }
}
