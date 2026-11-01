import {
    Cron,
    Description,
    DisplayIcon,
    DisplayMessage,
    EventSetting,
    Identifier,
    Name,
    Signature,
} from "@code0-tech/hercules";

/**
 * The Sheets API has no push webhooks, so this trigger polls on a cron schedule
 * (inherited from the {@link Cron} runtime flow type) and emits a
 * SHEETS_VALUE_RANGE with the watched range whenever a cell in it changed since
 * the previous poll.
 */
@Identifier("GoogleSheetsRowUpdated")
@DisplayIcon("simple:googlesheets")
@Name({ code: "en-US", content: "Google Sheets row updated" })
@Description({
    code: "en-US",
    content:
        "Triggered when a cell or row in a watched range changes. Polls the range on the configured cron schedule.",
})
@DisplayMessage({ code: "en-US", content: "Row updated in ${range}" })
@Signature(
    "(spreadsheetId: string, range: string, cron_minute: CRON_MINUTE, cron_hour: CRON_HOUR, cron_day_of_month: CRON_DAY_OF_MONTH, cron_month: CRON_MONTH, cron_day_of_week: CRON_DAY_OF_WEEK): SHEETS_VALUE_RANGE"
)
@EventSetting({
    identifier: "spreadsheetId",
    linkedDataTypeIdentifiers: ["TEXT"],
    name: [{ code: "en-US", content: "Spreadsheet ID" }],
    description: [{ code: "en-US", content: "The id of the spreadsheet to watch (from its URL)." }],
})
@EventSetting({
    identifier: "range",
    linkedDataTypeIdentifiers: ["TEXT"],
    name: [{ code: "en-US", content: "Range" }],
    description: [{ code: "en-US", content: "The range to watch, in A1 notation, e.g. Sheet1!A1:C100." }],
})
export class GoogleSheetsRowUpdated extends Cron {}
