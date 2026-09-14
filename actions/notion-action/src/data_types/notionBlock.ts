import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/notion-schemas.js";

export const NotionBlockSchema = schemas.NotionBlock;
export type NotionBlock = z.infer<typeof NotionBlockSchema>;

@Identifier("NOTION_BLOCK")
@Name({ code: "en-US", content: "Notion block" })
@DisplayMessage({ code: "en-US", content: "Notion block" })
@Schema(NotionBlockSchema)
export class NotionBlockDataType {}
