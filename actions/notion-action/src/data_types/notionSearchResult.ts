import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/notion-schemas.js";

export const NotionSearchResultSchema = schemas.NotionSearchResult;
export type NotionSearchResult = z.infer<typeof NotionSearchResultSchema>;

@Identifier("NOTION_SEARCH_RESULT")
@Name({ code: "en-US", content: "Notion search result" })
@DisplayMessage({ code: "en-US", content: "Notion search result" })
@Schema(NotionSearchResultSchema)
export class NotionSearchResultDataType {}
