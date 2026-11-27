import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * A file in an attachment field. Airtable fills every property when it reads a
 * record; to upload a file only `url` (and optionally `filename`) is needed.
 */
export const AirtableAttachmentSchema = z.object({
    id: z.string().nullish(),
    url: z.string(),
    filename: z.string().nullish(),
    size: z.number().nullish(),
    type: z.string().nullish(),
    width: z.number().nullish(),
    height: z.number().nullish(),
});
export type AirtableAttachmentType = z.infer<typeof AirtableAttachmentSchema>;

@Identifier("AIRTABLE_ATTACHMENT")
@Name({ code: "en-US", content: "Airtable Attachment" })
@DisplayMessage({ code: "en-US", content: "Airtable Attachment: ${filename}" })
@Schema(AirtableAttachmentSchema)
export class AirtableAttachment {}
