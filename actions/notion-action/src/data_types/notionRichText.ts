import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/notion-schemas.js";

export const NotionRichTextSchema = schemas.NotionRichText;
export type NotionRichText = z.infer<typeof NotionRichTextSchema>;

@Identifier("NOTION_RICH_TEXT")
@Name({ code: "en-US", content: "Notion rich text" })
@DisplayMessage({ code: "en-US", content: "Notion rich text" })
@Schema(NotionRichTextSchema)
export class NotionRichTextDataType {}
