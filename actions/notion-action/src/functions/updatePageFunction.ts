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
import { updatePage } from "../helpers.js";
import { NotionPage } from "../data_types/notionPage.js";

@Identifier("notionUpdatePage")
@DisplayIcon("tabler:file-pencil")
@Signature("(PageId: string, Properties: NOTION_PROPERTY_VALUE): NOTION_PAGE")
@Name({ code: "en-US", content: "Update page" })
@DisplayMessage({ code: "en-US", content: "Update page ${PageId}" })
@Documentation({
    code: "en-US",
    content:
        "Updates the properties of an existing Notion page.\n`Properties` is a map of property names to new property values (use `notionCreatePropertyValue` to build them).",
})
@Description({ code: "en-US", content: "Updates the properties of a Notion page." })
@Parameter({
    runtimeName: "PageId",
    name: [{ code: "en-US", content: "Page ID" }],
    description: [{ code: "en-US", content: "The ID of the page to update." }],
})
@Parameter({
    runtimeName: "Properties",
    name: [{ code: "en-US", content: "Properties" }],
    description: [{ code: "en-US", content: "A map of property names to the new property values." }],
})
export class UpdatePageFunction {
    async run(
        context: FunctionContext,
        PageId: string,
        Properties: Record<string, unknown>
    ): Promise<NotionPage> {
        try {
            return await updatePage({ pageId: PageId, properties: Properties }, context);
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            throw new RuntimeError(
                "ERROR_UPDATING_NOTION_PAGE",
                error instanceof Error ? error.message : "An error occurred while updating the Notion page."
            );
        }
    }
}
