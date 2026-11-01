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
import { archivePage } from "../helpers.js";

@Identifier("notionArchivePage")
@DisplayIcon("tabler:archive")
@Signature("(PageId: string): boolean")
@Name({ code: "en-US", content: "Archive page" })
@DisplayMessage({ code: "en-US", content: "Archive page ${PageId}" })
@Documentation({
    code: "en-US",
    content: "Archives (moves to trash) a Notion page. Returns true when the page was archived.",
})
@Description({ code: "en-US", content: "Archives a Notion page." })
@Parameter({
    runtimeName: "PageId",
    name: [{ code: "en-US", content: "Page ID" }],
    description: [{ code: "en-US", content: "The ID of the page to archive." }],
})
export class ArchivePageFunction {
    async run(context: FunctionContext, PageId: string): Promise<boolean> {
        try {
            return await archivePage(PageId, context);
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            throw new RuntimeError(
                "ERROR_ARCHIVING_NOTION_PAGE",
                error instanceof Error ? error.message : "An error occurred while archiving the Notion page."
            );
        }
    }
}
