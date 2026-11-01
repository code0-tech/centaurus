import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import { NotionRichText } from "../../data_types/notionRichText.js";

@Identifier("notionCreateRichText")
@DisplayIcon("tabler:text-size")
@Signature(
    "(Content: string, Bold?: boolean, Italic?: boolean, Strikethrough?: boolean, Underline?: boolean, Code?: boolean, Color?: string, LinkUrl?: string): NOTION_RICH_TEXT"
)
@Name({ code: "en-US", content: "Create rich text" })
@DisplayMessage({ code: "en-US", content: "Create Notion rich text ${Content}" })
@Documentation({
    code: "en-US",
    content:
        "Builds a Notion rich text object (`NOTION_RICH_TEXT`) from plain text with optional annotations and a link. Use it to assemble titles, text properties, and block content.",
})
@Description({ code: "en-US", content: "Builds a Notion rich text object from plain text." })
@Parameter({
    runtimeName: "Content",
    name: [{ code: "en-US", content: "Content" }],
    description: [{ code: "en-US", content: "The plain text content." }],
})
@Parameter({
    runtimeName: "Bold",
    name: [{ code: "en-US", content: "Bold" }],
    description: [{ code: "en-US", content: "Whether the text is bold." }],
    optional: true,
})
@Parameter({
    runtimeName: "Italic",
    name: [{ code: "en-US", content: "Italic" }],
    description: [{ code: "en-US", content: "Whether the text is italic." }],
    optional: true,
})
@Parameter({
    runtimeName: "Strikethrough",
    name: [{ code: "en-US", content: "Strikethrough" }],
    description: [{ code: "en-US", content: "Whether the text is struck through." }],
    optional: true,
})
@Parameter({
    runtimeName: "Underline",
    name: [{ code: "en-US", content: "Underline" }],
    description: [{ code: "en-US", content: "Whether the text is underlined." }],
    optional: true,
})
@Parameter({
    runtimeName: "Code",
    name: [{ code: "en-US", content: "Code" }],
    description: [{ code: "en-US", content: "Whether the text is formatted as inline code." }],
    optional: true,
})
@Parameter({
    runtimeName: "Color",
    name: [{ code: "en-US", content: "Color" }],
    description: [{ code: "en-US", content: 'A Notion color (e.g. "blue", "red_background").' }],
    optional: true,
})
@Parameter({
    runtimeName: "LinkUrl",
    name: [{ code: "en-US", content: "Link URL" }],
    description: [{ code: "en-US", content: "An optional URL turning the text into a link." }],
    optional: true,
})
export class CreateRichTextFunction {
    run(
        _context: unknown,
        Content: string,
        Bold?: boolean,
        Italic?: boolean,
        Strikethrough?: boolean,
        Underline?: boolean,
        Code?: boolean,
        Color?: string,
        LinkUrl?: string
    ): NotionRichText {
        return {
            type: "text",
            text: {
                content: Content,
                ...(LinkUrl ? { link: { url: LinkUrl } } : {}),
            },
            annotations: {
                bold: Bold ?? false,
                italic: Italic ?? false,
                strikethrough: Strikethrough ?? false,
                underline: Underline ?? false,
                code: Code ?? false,
                color: Color ?? "default",
            },
        };
    }
}
