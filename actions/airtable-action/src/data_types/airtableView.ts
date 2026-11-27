import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const AirtableViewSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
});
export type AirtableViewType = z.infer<typeof AirtableViewSchema>;

@Identifier("AIRTABLE_VIEW")
@Name({ code: "en-US", content: "Airtable View" })
@DisplayMessage({ code: "en-US", content: "Airtable View: ${name}" })
@Schema(AirtableViewSchema)
export class AirtableView {}
