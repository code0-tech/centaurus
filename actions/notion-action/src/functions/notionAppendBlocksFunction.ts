import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";
import type { NotionBlock } from "../data_types/notionBlock.js";

@Identifier("notionAppendBlocks")
@Name({ code: "en-US", content: "Append Notion blocks" })
@Description({ code: "en-US", content: "Append up to 100 blocks to a page or block." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Append Notion blocks" })
@Signature("(pageId: string, children: NOTION_BLOCK[]): NOTION_BLOCK_LIST")
@Parameter({ runtimeName: "pageId", name: [{ code: "en-US", content: "pageId" }], description: [{ code: "en-US", content: "Page or block ID" }] })
@Parameter({ runtimeName: "children", name: [{ code: "en-US", content: "children" }], description: [{ code: "en-US", content: "Blocks to append" }] })
export class NotionAppendBlocksFunction {
    run(context: FunctionContext, pageId: string, children: NotionBlock[]) {
        return new NotionClient(context.matchedConfig).appendBlocks(pageId, children);
    }
}

