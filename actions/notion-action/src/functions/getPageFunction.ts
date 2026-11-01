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
import { getPage } from "../helpers.js";
import { NotionPage } from "../data_types/notionPage.js";

@Identifier("notionGetPage")
@DisplayIcon("tabler:file-search")
@Signature("(PageId: string): NOTION_PAGE")
@Name({ code: "en-US", content: "Get page" })
@DisplayMessage({ code: "en-US", content: "Get page ${PageId}" })
@Documentation({
    code: "en-US",
    content: "Retrieves a Notion page, including its properties, by its page ID.",
})
@Description({ code: "en-US", content: "Retrieves a Notion page by ID." })
@Parameter({
    runtimeName: "PageId",
    name: [{ code: "en-US", content: "Page ID" }],
    description: [{ code: "en-US", content: "The ID of the page to retrieve." }],
})
export class GetPageFunction {
    async run(context: FunctionContext, PageId: string): Promise<NotionPage> {
        try {
            return await getPage(PageId, context);
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            throw new RuntimeError(
                "ERROR_GETTING_NOTION_PAGE",
                error instanceof Error ? error.message : "An error occurred while retrieving the Notion page."
            );
        }
    }
}
