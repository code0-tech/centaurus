import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/notion-schemas.js";

export const NotionUserSchema = schemas.NotionUser;
export type NotionUser = z.infer<typeof NotionUserSchema>;

@Identifier("NOTION_USER")
@Name({ code: "en-US", content: "Notion user" })
@DisplayMessage({ code: "en-US", content: "Notion user" })
@Schema(NotionUserSchema)
export class NotionUserDataType {}
