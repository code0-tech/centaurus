# Google Sheets Action

Google Sheets integration for the **Hercules** automation platform.

Append, read, update, look up, and clear spreadsheet rows — a universal
"dump this somewhere I can see it" sink and a lightweight database for
non-technical users.

## Functions

| Function | Description |
|----------|-------------|
| `sheetsAppendRow` | Append a single row to a sheet. |
| `sheetsUpdateRange` | Overwrite the values of a range (A1 notation). |
| `sheetsGetRange` | Read the values of a range (A1 notation). |
| `sheetsLookupRow` | Find the first row where a column equals a value. |
| `sheetsClearRange` | Clear the values of a range, keeping formatting. |
| `sheetsCreateSheet` | Add a new sheet (tab) to a spreadsheet. |
| `sheetsBatchUpdate` | Apply a list of raw Sheets API requests in one call. |

### Utilities

| Function | Description |
|----------|-------------|
| `sheetsCreateValueRange` | Build a `SHEETS_VALUE_RANGE` from a range and rows. |
| `sheetsCreateA1Range` | Build an A1-notation range string (quotes sheet names as needed). |

## Events

The Google Sheets API has no push webhooks, so both triggers **poll** on a cron
schedule (they build on the shared `CRON` runtime flow type).

| Event | Settings | Fires when |
|-------|----------|------------|
| `GoogleSheetsRowAdded` | `spreadsheetId`, `sheetName` | A new row is appended to the watched sheet. |
| `GoogleSheetsRowUpdated` | `spreadsheetId`, `range` | A cell or row in the watched range changes. |

## Configuration

| Config | Required | Description |
|--------|----------|-------------|
| `service_account_json` | yes | Service-account key JSON. The spreadsheets must be shared with the service account's email. |
| `scopes` | no | OAuth scopes, separated by spaces or commas. Defaults to `https://www.googleapis.com/auth/spreadsheets`. |

The `service_account_json` config default is backed by the
`GOOGLE_SERVICE_ACCOUNT_JSON` environment variable when set.

Authentication uses service-account (JWT) credentials via the official
[`google-auth-library`](https://www.npmjs.com/package/google-auth-library); API
calls go to the Google Sheets REST API with
[`axios`](https://www.npmjs.com/package/axios).

## Data types

| Identifier | Description |
|------------|-------------|
| `SHEETS_VALUE_RANGE` | A range and its cell values (`range`, `majorDimension`, `values`). |
| `SHEETS_UPDATE_RESULT` | The result of a write (`updatedRange`, `updatedRows`, `updatedColumns`, `updatedCells`). |
| `SHEETS_BATCH_RESULT` | The replies of a `batchUpdate`. |
| `SHEETS_ROW` | A single row (`rowNumber`, `matched`, `values`). |
| `SHEETS_SHEET` | A sheet (tab) and its grid properties. |
| `SHEETS_SPREADSHEET_META` | Spreadsheet metadata and its sheets. |
