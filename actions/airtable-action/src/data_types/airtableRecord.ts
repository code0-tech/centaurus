import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AirtableFieldMapSchema } from "./airtableFieldMap.js";

export const AirtableRecordSchema = z.object({
    id: z.string(),
    createdTime: z.string(),
    fields: AirtableFieldMapSchema,
});
export type AirtableRecordType = z.infer<typeof AirtableRecordSchema>;

@Identifier("AIRTABLE_RECORD")
@Name({ code: "en-US", content: "Airtable Record" })
@DisplayMessage({ code: "en-US", content: "Airtable Record: ${id}" })
@Schema(AirtableRecordSchema)
export class AirtableRecord {}
