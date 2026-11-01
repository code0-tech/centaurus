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
import { createPage } from "../helpers.js";
import { NotionPage } from "../data_types/notionPage.js";

@Identifier("notionCreatePage")
@DisplayIcon("tabler:file-plus")
@Signature(
    "(ParentDatabaseId: string, Properties: NOTION_PROPERTY_VALUE, Children?: NOTION_BLOCK[]): NOTION_PAGE"
)
@Name({ code: "en-US", content: "Create page" })
@DisplayMessage({ code: "en-US", content: "Create page in database ${ParentDatabaseId}" })
@Documentation({
    code: "en-US",
    content:
        "Creates a new page as a child of a Notion database.\n`Properties` is a map of the database's property names to property values (use `notionCreatePropertyValue` to build them).\n`Children` is an optional list of block objects added as page content.",
})
@Description({ code: "en-US", content: "Creates a new page in a Notion database." })
@Parameter({
    runtimeName: "ParentDatabaseId",
    name: [{ code: "en-US", content: "Parent database ID" }],
    description: [{ code: "en-US", content: "The ID of the database the new page is created in." }],
})
@Parameter({
    runtimeName: "Properties",
    name: [{ code: "en-US", content: "Properties" }],
    description: [
        { code: "en-US", content: "A map of property names to property values matching the database schema." },
    ],
})
@Parameter({
    runtimeName: "Children",
    name: [{ code: "en-US", content: "Children" }],
    description: [{ code: "en-US", content: "Optional block objects added as the page's content." }],
    optional: true,
})
export class CreatePageFunction {
    async run(
        context: FunctionContext,
        ParentDatabaseId: string,
        Properties: Record<string, unknown>,
        Children?: Record<string, unknown>[]
    ): Promise<NotionPage> {
        try {
            return await createPage(
                { parentDatabaseId: ParentDatabaseId, properties: Properties, children: Children },
                context
            );
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            throw new RuntimeError(
                "ERROR_CREATING_NOTION_PAGE",
                error instanceof Error ? error.message : "An error occurred while creating the Notion page."
            );
        }
    }
}
