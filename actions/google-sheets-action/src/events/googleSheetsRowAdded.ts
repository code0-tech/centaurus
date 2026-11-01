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
 * (inherited from the {@link Cron} runtime flow type) and emits a SHEETS_ROW for
 * each row appended to the watched sheet since the previous poll.
 */
@Identifier("GoogleSheetsRowAdded")
@DisplayIcon("simple:googlesheets")
@Name({ code: "en-US", content: "Google Sheets row added" })
@Description({
    code: "en-US",
    content: "Triggered when a new row is appended to a watched sheet. Polls the sheet on the configured cron schedule.",
})
@DisplayMessage({ code: "en-US", content: "Row added to ${sheetName}" })
@Signature(
    "(spreadsheetId: string, sheetName: string, cron_minute: CRON_MINUTE, cron_hour: CRON_HOUR, cron_day_of_month: CRON_DAY_OF_MONTH, cron_month: CRON_MONTH, cron_day_of_week: CRON_DAY_OF_WEEK): SHEETS_ROW"
)
@EventSetting({
    identifier: "spreadsheetId",
    linkedDataTypeIdentifiers: ["TEXT"],
    name: [{ code: "en-US", content: "Spreadsheet ID" }],
    description: [{ code: "en-US", content: "The id of the spreadsheet to watch (from its URL)." }],
})
@EventSetting({
    identifier: "sheetName",
    linkedDataTypeIdentifiers: ["TEXT"],
    name: [{ code: "en-US", content: "Sheet name" }],
    description: [{ code: "en-US", content: "The name of the sheet (tab) to watch, e.g. Sheet1." }],
})
export class GoogleSheetsRowAdded extends Cron {}
