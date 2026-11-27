import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AirtableRecordSchema } from "./airtableRecord.js";

export const AirtableRecordListSchema = z.object({
    records: z.array(AirtableRecordSchema),
});
export type AirtableRecordListType = z.infer<typeof AirtableRecordListSchema>;

@Identifier("AIRTABLE_RECORD_LIST")
@Name({ code: "en-US", content: "Airtable Record List" })
@DisplayMessage({ code: "en-US", content: "Airtable Records" })
@Schema(AirtableRecordListSchema)
export class AirtableRecordList {}
