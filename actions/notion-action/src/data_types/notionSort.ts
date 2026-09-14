import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/notion-schemas.js";

export const NotionSortSchema = schemas.NotionSort;
export type NotionSort = z.infer<typeof NotionSortSchema>;

@Identifier("NOTION_SORT")
@Name({ code: "en-US", content: "Notion database sort" })
@DisplayMessage({ code: "en-US", content: "Notion database sort" })
@Schema(NotionSortSchema)
export class NotionSortDataType {}
