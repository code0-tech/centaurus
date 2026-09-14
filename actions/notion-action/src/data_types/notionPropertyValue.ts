import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/notion-schemas.js";

export const NotionPropertyValueSchema = schemas.NotionPropertyValue;
export type NotionPropertyValue = z.infer<typeof NotionPropertyValueSchema>;

@Identifier("NOTION_PROPERTY_VALUE")
@Name({ code: "en-US", content: "Notion property value" })
@DisplayMessage({ code: "en-US", content: "Notion property value" })
@Schema(NotionPropertyValueSchema)
export class NotionPropertyValueDataType {}
