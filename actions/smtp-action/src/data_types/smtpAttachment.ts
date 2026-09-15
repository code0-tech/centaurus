import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * SMTP_ATTACHMENT mirrors the shape of a nodemailer attachment object
 * (see https://nodemailer.com/message/attachments/). Only the fields that make
 * sense to build from a flow are exposed; `content` is always provided as a
 * string and interpreted according to `encoding` (e.g. "base64" for binary
 * files, "utf-8" for text).
 */
export const SmtpAttachmentSchema = z.object({
    filename: z.string().describe("The file name shown to the recipient, e.g. \"invoice.pdf\"."),
    content: z.string().describe("The attachment content as a string. Interpreted using the encoding field."),
    contentType: z.string().nullish().describe("The MIME type of the attachment, e.g. \"application/pdf\". Derived from the filename when omitted."),
    encoding: z.string().nullish().describe("How to decode content, e.g. \"base64\" or \"utf-8\". Defaults to utf-8."),
});
export type SmtpAttachment = z.infer<typeof SmtpAttachmentSchema>;

@Identifier("SMTP_ATTACHMENT")
@Name({ code: "en-US", content: "Email attachment" })
@DisplayMessage({ code: "en-US", content: "Email attachment ${filename}" })
@Schema(SmtpAttachmentSchema)
export class SmtpAttachmentDataType {}
