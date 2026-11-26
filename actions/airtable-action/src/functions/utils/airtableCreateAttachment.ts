import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { requireId } from "../../client.js";
import { AirtableAttachmentType } from "../../data_types/airtableAttachment.js";

@Identifier("airtableCreateAttachment")
@Signature("(url: string, filename?: string): AIRTABLE_ATTACHMENT")
@Name({ code: "en-US", content: "Create Airtable attachment" })
@DisplayIcon("simple:airtable")
@DisplayMessage({ code: "en-US", content: "Attach ${url}" })
@Documentation({
    code: "en-US",
    content:
        "Creates an attachment for an attachment field. Airtable downloads the file from the public URL; put a list of attachments into the field.",
})
@Description({ code: "en-US", content: "Create an attachment from a public URL." })
@Parameter({
    runtimeName: "url",
    name: [{ code: "en-US", content: "URL" }],
    description: [{ code: "en-US", content: "A public http(s) URL Airtable can download the file from." }],
})
@Parameter({
    runtimeName: "filename",
    name: [{ code: "en-US", content: "File name" }],
    description: [{ code: "en-US", content: "The name the file gets in Airtable. Empty takes it from the URL." }],
    optional: true,
})
export class AirtableCreateAttachmentFunction {
    run(_context: unknown, url: string, filename?: string): AirtableAttachmentType {
        const link = requireId(url, "url");
        if (!/^https?:\/\//i.test(link)) {
            throw new RuntimeError("AIRTABLE_INVALID_ATTACHMENT_URL", "An attachment needs a public http(s) URL.");
        }

        const name = filename?.trim();
        return name ? { url: link, filename: name } : { url: link };
    }
}
