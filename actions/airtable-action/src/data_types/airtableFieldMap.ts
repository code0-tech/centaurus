import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * The cell values of a record, keyed by field name. Airtable leaves out empty
 * cells, so a field that is not in the map is empty.
 */
export const AirtableFieldMapSchema = z.record(z.string(), z.any());
export type AirtableFieldMapType = z.infer<typeof AirtableFieldMapSchema>;

@Identifier("AIRTABLE_FIELD_MAP")
@Name({ code: "en-US", content: "Airtable Field Map" })
@DisplayMessage({ code: "en-US", content: "Airtable fields" })
@Schema(AirtableFieldMapSchema)
export class AirtableFieldMap {}
