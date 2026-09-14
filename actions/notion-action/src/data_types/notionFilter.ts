import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/notion-schemas.js";

export const NotionFilterSchema = schemas.NotionFilter;
export type NotionFilter = z.infer<typeof NotionFilterSchema>;

@Identifier("NOTION_FILTER")
@Name({ code: "en-US", content: "Notion database filter" })
@DisplayMessage({ code: "en-US", content: "Notion database filter" })
@Schema(NotionFilterSchema)
export class NotionFilterDataType {}
