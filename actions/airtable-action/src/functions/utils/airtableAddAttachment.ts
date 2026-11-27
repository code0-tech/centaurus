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
import { parseFieldMap } from "../../helpers.js";
import { AirtableAttachmentType } from "../../data_types/airtableAttachment.js";
import { AirtableFieldMapType } from "../../data_types/airtableFieldMap.js";

@Identifier("airtableAddAttachment")
@Signature("(field: string, url: string, filename?: string, fields?: AIRTABLE_FIELD_MAP): AIRTABLE_FIELD_MAP")
@Name({ code: "en-US", content: "Add Airtable attachment" })
@DisplayIcon("simple:airtable")
@DisplayMessage({ code: "en-US", content: "Attach ${url} to ${field}" })
@Documentation({
    code: "en-US",
    content:
        "Adds a file to an attachment field of a field map. Airtable downloads the file from the public URL. Chain calls to add several files or to combine it with `airtableCreateFieldMap`. When a record is updated, the files replace the ones it had.",
})
@Description({ code: "en-US", content: "Add a file from a public URL to an attachment field." })
@Parameter({
    runtimeName: "field",
    name: [{ code: "en-US", content: "Field" }],
    description: [{ code: "en-US", content: "The name or ID (starts with `fld`) of the attachment field." }],
})
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
@Parameter({
    runtimeName: "fields",
    name: [{ code: "en-US", content: "Fields" }],
    description: [{ code: "en-US", content: "The field map to add the file to. Empty starts a new one." }],
    optional: true,
})
export class AirtableAddAttachmentFunction {
    run(
        _context: unknown,
        field: string,
        url: string,
        filename?: string,
        fields?: AirtableFieldMapType | string
    ): AirtableFieldMapType {
        const name = requireId(field, "field");
        const base = fields === undefined || fields === null || fields === "" ? {} : parseFieldMap(fields);
        const existing = Array.isArray(base[name]) ? (base[name] as unknown[]) : [];

        return { ...base, [name]: [...existing, attachment(url, filename)] };
    }
}

function attachment(url: string, filename?: string): AirtableAttachmentType {
    const link = requireId(url, "url");
    if (!/^https?:\/\//i.test(link)) {
        throw new RuntimeError("AIRTABLE_INVALID_ATTACHMENT_URL", "An attachment needs a public http(s) URL.");
    }

    const name = filename?.trim();
    return name ? { url: link, filename: name } : { url: link };
}
