import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import { INTEGRATION_TOKEN_PARAMETER } from "../data_types/notionIntegrationToken.js";
import type { NotionProperties } from "../data_types/notionProperties.js";

@Identifier("notionCreatePage")
@Name({ code: "en-US", content: "Create Notion page" })
@Description({ code: "en-US", content: "Create a page in a shared Notion database, optionally with content written as Markdown." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Create Notion page" })
@Signature("(integrationToken: NOTION_INTEGRATION_TOKEN, parentDatabaseId: string, properties: NOTION_PROPERTIES, markdown?: string): NOTION_PAGE")
@Parameter(INTEGRATION_TOKEN_PARAMETER)
@Parameter({ runtimeName: "parentDatabaseId", name: [{ code: "en-US", content: "parentDatabaseId" }], description: [{ code: "en-US", content: "Database ID" }] })
@Parameter({ runtimeName: "properties", name: [{ code: "en-US", content: "properties" }], description: [{ code: "en-US", content: "Property names mapped to writable Notion property values" }] })
@Parameter({ runtimeName: "markdown", name: [{ code: "en-US", content: "Content (Markdown)" }], description: [{ code: "en-US", content: "Optional page content as Markdown, e.g. headings, lists, to-dos (- [ ]), code blocks and links" }], optional: true })
export class NotionCreatePageFunction {
    run(_context: FunctionContext, integrationToken: string, parentDatabaseId: string, properties: NotionProperties, markdown?: string | null) {
        return new NotionClient(integrationToken).createPage(parentDatabaseId, properties, markdown);
    }
}
