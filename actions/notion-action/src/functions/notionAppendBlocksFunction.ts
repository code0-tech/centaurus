import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import { INTEGRATION_TOKEN_PARAMETER } from "../data_types/notionIntegrationToken.js";
import type { NotionBlock } from "../data_types/notionBlock.js";

@Identifier("notionAppendBlocks")
@Name({ code: "en-US", content: "Append Notion blocks" })
@Description({ code: "en-US", content: "Append up to 100 blocks to a page or block." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Append Notion blocks" })
@Signature("(integrationToken: NOTION_INTEGRATION_TOKEN, pageId: string, children: NOTION_BLOCK | NOTION_BLOCK[]): NOTION_BLOCK_LIST")
@Parameter(INTEGRATION_TOKEN_PARAMETER)
@Parameter({ runtimeName: "pageId", name: [{ code: "en-US", content: "pageId" }], description: [{ code: "en-US", content: "Page or block ID" }] })
@Parameter({ runtimeName: "children", name: [{ code: "en-US", content: "children" }], description: [{ code: "en-US", content: "A block or a list of blocks to append (maximum 100)" }] })
export class NotionAppendBlocksFunction {
    run(_context: FunctionContext, integrationToken: string, pageId: string, children: NotionBlock | NotionBlock[]) {
        return new NotionClient(integrationToken).appendBlocks(pageId, children);
    }
}

