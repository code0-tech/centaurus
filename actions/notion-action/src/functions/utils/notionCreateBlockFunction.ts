import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules";
import { z } from "zod";
import { NotionRichTextSchema, type NotionRichText } from "../../data_types/notionRichText.js";
import { NotionBlockRequestSchema, NotionBlockSchema, type NotionBlock } from "../../data_types/notionBlock.js";

const TEXT_BLOCK_TYPES = [
    "paragraph", "heading_1", "heading_2", "heading_3", "bulleted_list_item", "numbered_list_item",
    "to_do", "quote", "callout", "code", "toggle",
] as const;
const BLOCK_TYPES = [...TEXT_BLOCK_TYPES, "divider"] as const;
type BlockType = (typeof BLOCK_TYPES)[number];

const TextInputSchema = z.union([z.string().max(2000), z.array(NotionRichTextSchema)]);

@Identifier("notionCreateBlock")
@Name({ code: "en-US", content: "Create Notion block" })
@Description({ code: "en-US", content: "Build a block for create page or append blocks. Types: paragraph, heading_1, heading_2, heading_3, bulleted_list_item, numbered_list_item, to_do, quote, callout, code, toggle, divider. Text is plain text or rich-text items; divider takes none. checked applies to to_do, language to code (defaults to plain text)." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Create Notion ${type} block" })
@Signature(`(type: ${BLOCK_TYPES.map((type) => `"${type}"`).join(" | ")}, text?: string | NOTION_RICH_TEXT[], checked?: boolean, language?: string): NOTION_BLOCK`)
@Parameter({ runtimeName: "type", name: [{ code: "en-US", content: "Block type" }], description: [{ code: "en-US", content: "The kind of block, e.g. paragraph, heading_2, to_do, code or divider" }] })
@Parameter({ runtimeName: "text", name: [{ code: "en-US", content: "Text" }], description: [{ code: "en-US", content: "Plain text or rich-text items. Not used by divider." }], optional: true })
@Parameter({ runtimeName: "checked", name: [{ code: "en-US", content: "Checked" }], description: [{ code: "en-US", content: "Whether a to_do block is checked" }], optional: true })
@Parameter({ runtimeName: "language", name: [{ code: "en-US", content: "Code language" }], description: [{ code: "en-US", content: "Language of a code block, e.g. typescript or json" }], optional: true })
export class NotionCreateBlockFunction {
    run(_context: unknown, type: string, text?: string | NotionRichText[] | null, checked?: boolean | null, language?: string | null): NotionBlock {
        if (!(BLOCK_TYPES as readonly string[]).includes(type)) {
            throw new RuntimeError("NOTION_INVALID_BLOCK_TYPE", `Unsupported block type: ${type}. Use one of ${BLOCK_TYPES.join(", ")}.`);
        }
        const blockType = type as BlockType;
        if (blockType === "divider") return this.validate(blockType, { type: "divider", divider: {} });

        const parsed = TextInputSchema.safeParse(text ?? "");
        if (!parsed.success) throw new RuntimeError("NOTION_INVALID_BLOCK_TEXT", "Block text must be plain text (max 2000 characters) or rich-text items.");
        const rich_text = typeof parsed.data === "string"
            ? (parsed.data ? [{ type: "text" as const, text: { content: parsed.data } }] : [])
            : parsed.data;

        const content: Record<string, unknown> = { rich_text };
        if (blockType === "to_do") content.checked = checked ?? false;
        if (blockType === "code") content.language = language ?? "plain text";
        return this.validate(blockType, { type: blockType, [blockType]: content });
    }

    private validate(type: BlockType, block: unknown): NotionBlock {
        // Check against the full Notion request shape (e.g. supported code
        // languages), then return it as the compact NOTION_BLOCK data type.
        const result = NotionBlockRequestSchema.safeParse(block).success ? NotionBlockSchema.safeParse(block) : undefined;
        if (!result?.success) {
            throw new RuntimeError("NOTION_INVALID_BLOCK", type === "code"
                ? "Invalid code block. Check that language is a language Notion supports."
                : `Invalid value for Notion block type ${type}.`);
        }
        return result.data;
    }
}
