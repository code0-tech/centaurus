import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/notion-schemas.js";

export const NotionPropertiesSchema = schemas.NotionProperties;
export type NotionProperties = z.infer<typeof NotionPropertiesSchema>;

@Identifier("NOTION_PROPERTIES")
@Name({ code: "en-US", content: "Notion properties" })
@DisplayMessage({ code: "en-US", content: "Notion properties" })
@Schema(NotionPropertiesSchema)
export class NotionPropertiesDataType {}
