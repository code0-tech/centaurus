import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const SheetsBatchResultSchema = z.object({
    spreadsheetId: z.string().describe("The id of the spreadsheet the batch update was applied to."),
    replies: z
        .array(z.record(z.string(), z.unknown()))
        .default([])
        .describe("One reply per request, in the same order as the requests. Empty objects mark requests with no reply."),
});
export type SheetsBatchResult = z.infer<typeof SheetsBatchResultSchema>;

@Identifier("SHEETS_BATCH_RESULT")
@Name({ code: "en-US", content: "Sheets batch result" })
@DisplayMessage({ code: "en-US", content: "Batch update on ${spreadsheetId}" })
@Schema(SheetsBatchResultSchema)
export class SheetsBatchResultDataType {}
