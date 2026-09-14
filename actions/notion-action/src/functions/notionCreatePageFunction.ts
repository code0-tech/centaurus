import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import type { NotionProperties } from "../data_types/notionProperties.js";
import type { NotionBlock } from "../data_types/notionBlock.js";

@Identifier("notionCreatePage")
@Name({ code: "en-US", content: "Create Notion page" })
@Description({ code: "en-US", content: "Create a page in a shared Notion database." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Create Notion page" })
@Signature("(parentDatabaseId: string, properties: NOTION_PROPERTIES, children?: NOTION_BLOCK[]): NOTION_PAGE")
@Parameter({ runtimeName: "parentDatabaseId", name: [{ code: "en-US", content: "parentDatabaseId" }], description: [{ code: "en-US", content: "Database ID" }] })
@Parameter({ runtimeName: "properties", name: [{ code: "en-US", content: "properties" }], description: [{ code: "en-US", content: "Property names mapped to writable Notion property values" }] })
@Parameter({ runtimeName: "children", name: [{ code: "en-US", content: "children" }], description: [{ code: "en-US", content: "Optional initial blocks (maximum 100)" }] })
export class NotionCreatePageFunction {
    run(context: FunctionContext, parentDatabaseId: string, properties: NotionProperties, children?: NotionBlock[]) {
        return new NotionClient(context.matchedConfig).createPage(parentDatabaseId, properties, children);
    }
}

