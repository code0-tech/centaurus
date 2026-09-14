import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/notion-schemas.js";

export const NotionQueryResultSchema = schemas.NotionQueryResult;
export type NotionQueryResult = z.infer<typeof NotionQueryResultSchema>;

@Identifier("NOTION_QUERY_RESULT")
@Name({ code: "en-US", content: "Notion query result" })
@DisplayMessage({ code: "en-US", content: "Notion query result" })
@Schema(NotionQueryResultSchema)
export class NotionQueryResultDataType {}
