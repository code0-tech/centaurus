import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const AirtableBaseSchema = z.object({
    id: z.string(),
    name: z.string(),
    permissionLevel: z.string(),
});
export type AirtableBaseType = z.infer<typeof AirtableBaseSchema>;

@Identifier("AIRTABLE_BASE")
@Name({ code: "en-US", content: "Airtable Base" })
@DisplayMessage({ code: "en-US", content: "Airtable Base: ${name}" })
@Schema(AirtableBaseSchema)
export class AirtableBase {}
