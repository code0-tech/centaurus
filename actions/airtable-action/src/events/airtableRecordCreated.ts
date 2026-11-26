import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

@Identifier("AirtableRecordCreated")
@DisplayIcon("simple:airtable")
@Name({ code: "en-US", content: "Airtable record created" })
@Description({
    code: "en-US",
    content: "Triggered when a record is created in a table. The table is checked for new records once a minute by default.",
})
@DisplayMessage({ code: "en-US", content: "Airtable record created" })
@Signature("(apiToken: string, baseId: string, tableId: string): AIRTABLE_RECORD")
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
export class AirtableRecordCreated {}
