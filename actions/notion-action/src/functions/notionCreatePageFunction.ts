import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import { INTEGRATION_TOKEN_PARAMETER } from "../integrationToken.js";
import { databaseIdParameter } from "../parameters.js";

@Identifier("notionCreatePage")
@Name({ code: "en-US", content: "Create Notion page" })
@Description({ code: "en-US", content: "Create a page in a shared Notion database, optionally with content written as Markdown." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Create Notion page" })
@Signature("(integrationToken: string, parentDatabaseId: string, properties: OBJECT<{ [key: string]: any }>, markdown?: string): NOTION_PAGE")
@Parameter(INTEGRATION_TOKEN_PARAMETER)
@Parameter(databaseIdParameter("parentDatabaseId"))
@Parameter({ runtimeName: "properties", name: [{ code: "en-US", content: "Properties" }], description: [{ code: "en-US", content: "Column values as an object, e.g. { \"Name\": \"Task\", \"Done\": true, \"Tags\": [\"a\", \"b\"], \"Due\": \"2026-09-14\" }. The values are converted using the column types of the database." }] })
@Parameter({ runtimeName: "markdown", name: [{ code: "en-US", content: "Content (Markdown)" }], description: [{ code: "en-US", content: "Optional page content as Markdown, e.g. headings, lists, to-dos (- [ ]), code blocks and links" }], optional: true })
export class NotionCreatePageFunction {
    run(_context: FunctionContext, integrationToken: string, parentDatabaseId: string, properties: Record<string, unknown>, markdown?: string | null) {
        return new NotionClient(integrationToken).createPage(parentDatabaseId, properties, markdown);
    }
}
