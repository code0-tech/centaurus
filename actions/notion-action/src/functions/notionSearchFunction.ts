import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import { INTEGRATION_TOKEN_PARAMETER } from "../integrationToken.js";

@Identifier("notionSearch")
@Name({ code: "en-US", content: "Search Notion" })
@Description({ code: "en-US", content: "Search accessible page and database titles, following every pagination cursor." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Search Notion" })
@Signature("(integrationToken: string, query: string): NOTION_SEARCH_RESULT")
@Parameter(INTEGRATION_TOKEN_PARAMETER)
@Parameter({ runtimeName: "query", name: [{ code: "en-US", content: "Search text" }], description: [{ code: "en-US", content: "Text to search for in page and database titles. Leave empty to list everything the integration can access." }] })
export class NotionSearchFunction {
    run(_context: FunctionContext, integrationToken: string, query: string) {
        return new NotionClient(integrationToken).search(query);
    }
}
