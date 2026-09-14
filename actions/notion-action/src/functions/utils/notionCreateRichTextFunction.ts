import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules";
import type { NotionRichText } from "../../data_types/notionRichText.js";

@Identifier("notionCreateRichText")
@Name({ code: "en-US", content: "Create Notion rich text" })
@Description({ code: "en-US", content: "Build one text item for a title, rich-text property or block." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Create Notion rich text" })
@Signature("(content: string, url?: string, bold?: boolean, italic?: boolean): NOTION_RICH_TEXT")
@Parameter({ runtimeName: "content", name: [{ code: "en-US", content: "Text content" }] })
@Parameter({ runtimeName: "url", name: [{ code: "en-US", content: "Optional link URL" }] })
@Parameter({ runtimeName: "bold", name: [{ code: "en-US", content: "Bold" }] })
@Parameter({ runtimeName: "italic", name: [{ code: "en-US", content: "Italic" }] })
export class NotionCreateRichTextFunction {
    run(_context: unknown, content: string, url?: string, bold = false, italic = false): NotionRichText {
        if (content.length > 2000) throw new RuntimeError("NOTION_TEXT_TOO_LONG", "One rich-text item supports at most 2000 characters.");
        return {
            type: "text",
            text: { content, ...(url === undefined ? {} : { link: { url } }) },
            annotations: { bold, italic },
        };
    }
}
