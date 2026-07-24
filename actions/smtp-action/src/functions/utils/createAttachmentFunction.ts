import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import { SmtpAttachment } from "../../data_types/smtpAttachment.js";

@Identifier("createAttachment")
@DisplayIcon("tabler:paperclip")
@Signature("(Filename: string, Content: string, ContentType?: string, Encoding?: string): SMTP_ATTACHMENT")
@Name({ code: "en-US", content: "Create email attachment" })
@DisplayMessage({ code: "en-US", content: "Create email attachment ${Filename}" })
@Documentation({
    code: "en-US",
    content:
        "Builds an email attachment object for use with the sendEmailWithAttachments function.\nUse encoding \"base64\" for binary files (e.g. PDFs, images) and \"utf-8\" for plain text.",
})
@Description({
    code: "en-US",
    content: "Creates an email attachment object.",
})
@Parameter({
    runtimeName: "Filename",
    name: [{ code: "en-US", content: "File name" }],
    description: [{ code: "en-US", content: "The file name shown to the recipient, e.g. \"invoice.pdf\"." }],
})
@Parameter({
    runtimeName: "Content",
    name: [{ code: "en-US", content: "Content" }],
    description: [{ code: "en-US", content: "The attachment content as a string. Interpreted using the encoding." }],
})
@Parameter({
    runtimeName: "ContentType",
    name: [{ code: "en-US", content: "Content type" }],
    description: [{ code: "en-US", content: "The MIME type, e.g. \"application/pdf\". Derived from the file name when omitted." }],
    optional: true,
})
@Parameter({
    runtimeName: "Encoding",
    name: [{ code: "en-US", content: "Encoding" }],
    description: [{ code: "en-US", content: "How to decode content, e.g. \"base64\" or \"utf-8\". Defaults to utf-8." }],
    optional: true,
})
export class CreateAttachmentFunction {
    run(
        _context: unknown,
        Filename: string,
        Content: string,
        ContentType?: string,
        Encoding?: string
    ): SmtpAttachment {
        return {
            filename: Filename,
            content: Content,
            contentType: ContentType,
            encoding: Encoding,
        };
    }
}
