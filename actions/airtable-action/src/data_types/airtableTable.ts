import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AirtableFieldSchema } from "./airtableField.js";
import { AirtableViewSchema } from "./airtableView.js";

export const AirtableTableSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    primaryFieldId: z.string(),
    fields: z.array(AirtableFieldSchema),
    views: z.array(AirtableViewSchema),
});
export type AirtableTableType = z.infer<typeof AirtableTableSchema>;

@Identifier("AIRTABLE_TABLE")
@Name({ code: "en-US", content: "Airtable Table" })
@DisplayMessage({ code: "en-US", content: "Airtable Table: ${name}" })
@Schema(AirtableTableSchema)
export class AirtableTable {}
