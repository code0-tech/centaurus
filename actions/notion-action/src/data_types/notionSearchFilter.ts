import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/notion-schemas.js";

export const NotionSearchFilterSchema = schemas.NotionSearchFilter;
export type NotionSearchFilter = z.infer<typeof NotionSearchFilterSchema>;

@Identifier("NOTION_SEARCH_FILTER")
@Name({ code: "en-US", content: "Notion search filter" })
@DisplayMessage({ code: "en-US", content: "Notion search filter" })
@Schema(NotionSearchFilterSchema)
export class NotionSearchFilterDataType {}
