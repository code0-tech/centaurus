import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/notion-schemas.js";

export const NotionPageSchema = schemas.NotionPage;
export type NotionPage = z.infer<typeof NotionPageSchema>;

@Identifier("NOTION_PAGE")
@Name({ code: "en-US", content: "Notion page" })
@DisplayMessage({ code: "en-US", content: "Notion page" })
@Schema(NotionPageSchema)
export class NotionPageDataType {}
