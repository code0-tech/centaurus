import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/notion-schemas.js";

/**
 * A page as Notion returns it, plus its content as Markdown. Only Get Notion
 * page fills in `markdown`; other functions and the triggers return the page
 * without content, which would cost an extra request per page.
 */
export const NotionPageSchema = schemas.NotionPage.unwrap().extend({
    markdown: z.string().optional().describe("The page content as Notion-flavored Markdown. Only set by Get Notion page."),
});
export type NotionPage = z.infer<typeof NotionPageSchema>;

@Identifier("NOTION_PAGE")
@Name({ code: "en-US", content: "Notion page" })
@DisplayMessage({ code: "en-US", content: "Notion page" })
@Schema(NotionPageSchema)
export class NotionPageDataType {}
