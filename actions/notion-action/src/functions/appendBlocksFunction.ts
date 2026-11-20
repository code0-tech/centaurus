import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { appendBlocks } from "../helpers.js";
import { NotionBlockList } from "../data_types/notionBlockList.js";

@Identifier("notionAppendBlocks")
@DisplayIcon("tabler:row-insert-bottom")
@Signature("(PageId: string, Children: NOTION_BLOCK[]): NOTION_BLOCK_LIST")
@Name({ code: "en-US", content: "Append blocks" })
@DisplayMessage({ code: "en-US", content: "Append blocks to ${PageId}" })
@Documentation({
    code: "en-US",
    content:
        "Appends block children to a Notion page or block.\n`Children` is a list of Notion block objects. Returns the list of blocks that were appended.",
})
@Description({ code: "en-US", content: "Appends block content to a Notion page." })
@Parameter({
    runtimeName: "PageId",
    name: [{ code: "en-US", content: "Page ID" }],
    description: [{ code: "en-US", content: "The ID of the page (or block) to append children to." }],
})
@Parameter({
    runtimeName: "Children",
    name: [{ code: "en-US", content: "Children" }],
    description: [{ code: "en-US", content: "The block objects to append." }],
})
export class AppendBlocksFunction {
    async run(
        context: FunctionContext,
        PageId: string,
        Children: Record<string, unknown>[]
    ): Promise<NotionBlockList> {
        try {
            return await appendBlocks({ pageId: PageId, children: Children }, context);
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            throw new RuntimeError(
                "ERROR_APPENDING_NOTION_BLOCKS",
                error instanceof Error ? error.message : "An error occurred while appending Notion blocks."
            );
        }
    }
}
