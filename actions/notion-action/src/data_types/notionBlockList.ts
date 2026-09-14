import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/notion-schemas.js";

export const NotionBlockListSchema = schemas.NotionBlockList;
export type NotionBlockList = z.infer<typeof NotionBlockListSchema>;

@Identifier("NOTION_BLOCK_LIST")
@Name({ code: "en-US", content: "Notion block list" })
@DisplayMessage({ code: "en-US", content: "Notion block list" })
@Schema(NotionBlockListSchema)
export class NotionBlockListDataType {}
