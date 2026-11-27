import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

@Identifier("AirtableRecordUpdated")
@DisplayIcon("simple:airtable")
@Name({ code: "en-US", content: "Airtable record updated" })
@Description({
    code: "en-US",
    content:
        "Triggered when a record of a table changes, optionally only when one of the watched fields changes. The table is checked for changes once a minute by default.",
})
@DisplayMessage({ code: "en-US", content: "Airtable record updated" })
@Signature("(apiToken: string, baseId: string, tableId: string, watchedFields?: string): AIRTABLE_RECORD")
@EventSetting({
    identifier: "apiToken",
    name: [{ code: "en-US", content: "Personal access token" }],
    description: [
        { code: "en-US", content: "An Airtable personal access token that can read the table (scope data.records:read)." },
    ],
})
@EventSetting({
    identifier: "baseId",
    name: [{ code: "en-US", content: "Base ID" }],
    description: [{ code: "en-US", content: "The ID of the base, starts with `app`." }],
})
@EventSetting({
    identifier: "tableId",
    name: [{ code: "en-US", content: "Table" }],
    description: [{ code: "en-US", content: "The ID (starts with `tbl`) or the name of the table to watch." }],
})
@EventSetting({
    identifier: "watchedFields",
    name: [{ code: "en-US", content: "Watched fields" }],
    description: [
        {
            code: "en-US",
            content: "Comma separated field names. Only changes to these fields trigger. Empty reacts to every field.",
        },
    ],
    optional: true,
})
export class AirtableRecordUpdated {}
