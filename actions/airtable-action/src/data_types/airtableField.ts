import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/** A column of a table as the metadata API describes it. */
export const AirtableFieldSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    description: z.string().nullish(),
    options: z.record(z.string(), z.any()).nullish(),
});
export type AirtableFieldType = z.infer<typeof AirtableFieldSchema>;

@Identifier("AIRTABLE_FIELD")
@Name({ code: "en-US", content: "Airtable Field" })
@DisplayMessage({ code: "en-US", content: "Airtable Field: ${name}" })
@Schema(AirtableFieldSchema)
export class AirtableField {}
