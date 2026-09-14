import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/notion-schemas.js";

export const NotionDatabaseSchema = schemas.NotionDatabase;
export type NotionDatabase = z.infer<typeof NotionDatabaseSchema>;

@Identifier("NOTION_DATABASE")
@Name({ code: "en-US", content: "Notion database" })
@DisplayMessage({ code: "en-US", content: "Notion database" })
@Schema(NotionDatabaseSchema)
export class NotionDatabaseDataType {}
