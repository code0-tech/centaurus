import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const AirtableSortDirectionSchema = z.enum(["asc", "desc"]);

export const AirtableSortSchema = z.object({
    field: z.string(),
    direction: AirtableSortDirectionSchema.nullish(),
});
export type AirtableSortType = z.infer<typeof AirtableSortSchema>;

@Identifier("AIRTABLE_SORT")
@Name({ code: "en-US", content: "Airtable Sort" })
@DisplayMessage({ code: "en-US", content: "Sort by ${field}" })
@Schema(AirtableSortSchema)
export class AirtableSort {}
