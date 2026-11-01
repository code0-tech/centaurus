import { FunctionContext, RuntimeError } from "@code0-tech/hercules";
import axios, { AxiosInstance } from "axios";
import { JWT } from "google-auth-library";
import { SheetsUpdateResult, SheetsUpdateResultSchema } from "./data_types/sheetsUpdateResult.js";
import { SheetsValueRange, SheetsValueRangeSchema } from "./data_types/sheetsValueRange.js";
import { SheetsRow, SheetsRowSchema } from "./data_types/sheetsRow.js";
import { SheetsSheet, SheetsSheetSchema } from "./data_types/sheetsSheet.js";
import { SheetsBatchResult, SheetsBatchResultSchema } from "./data_types/sheetsBatchResult.js";

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const DEFAULT_SCOPES = "https://www.googleapis.com/auth/spreadsheets";

interface ServiceAccountKey {
    client_email: string;
    private_key: string;
}

/**
 * Resolves the service-account credentials and scopes from the matched action
 * config. The config defaults may be backed by the GOOGLE_SERVICE_ACCOUNT_JSON
 * environment variable (see `index.ts`).
 */
function getAuthConfig(context: FunctionContext): { key: ServiceAccountKey; scopes: string[] } {
    const raw = context.matchedConfig.findConfig("service_account_json") as string;
    if (!raw) {
        throw new RuntimeError(
            "MISSING_GOOGLE_CREDENTIALS",
            "A service_account_json must be configured for this action."
        );
    }

    let key: ServiceAccountKey;
    try {
        key = JSON.parse(raw) as ServiceAccountKey;
    } catch {
        throw new RuntimeError(
            "INVALID_GOOGLE_CREDENTIALS",
            "The configured service_account_json is not valid JSON."
        );
    }

    if (!key.client_email || !key.private_key) {
        throw new RuntimeError(
            "INVALID_GOOGLE_CREDENTIALS",
            "The service_account_json must contain client_email and private_key."
        );
    }

    const scopes = ((context.matchedConfig.findConfig("scopes") as string) || DEFAULT_SCOPES)
        .split(/[\s,]+/)
        .map((scope) => scope.trim())
        .filter(Boolean);

    return { key, scopes };
}

// JWT clients cache their own access token and refresh it transparently, so we
// cache one client per (service account, scopes) pair to reuse those tokens.
const clientCache = new Map<string, JWT>();

function getJwtClient(context: FunctionContext): JWT {
    const { key, scopes } = getAuthConfig(context);
    const cacheKey = `${key.client_email}::${scopes.join(",")}`;

    let client = clientCache.get(cacheKey);
    if (!client) {
        client = new JWT({ email: key.client_email, key: key.private_key, scopes });
        clientCache.set(cacheKey, client);
    }
    return client;
}

/**
 * Builds an axios instance that signs every request with a fresh service-account
 * bearer token against the Google Sheets API.
 */
async function getSheetsHttpClient(context: FunctionContext): Promise<AxiosInstance> {
    const client = getJwtClient(context);

    let accessToken: string | null | undefined;
    try {
        accessToken = (await client.getAccessToken()).token;
    } catch (error: any) {
        throw new RuntimeError(
            "GOOGLE_AUTH_FAILED",
            `Failed to obtain a Google access token: ${error?.message ?? "unknown error"}`
        );
    }

    if (!accessToken) {
        throw new RuntimeError("GOOGLE_AUTH_FAILED", "Google returned an empty access token.");
    }

    return axios.create({
        baseURL: SHEETS_API_BASE,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    });
}

/**
 * Normalises a Sheets API error into a RuntimeError with the given code.
 */
function toRuntimeError(error: any, code: string, fallback: string): RuntimeError {
    if (error instanceof RuntimeError) {
        return error;
    }
    const apiMessage = error?.response?.data?.error?.message;
    if (apiMessage) {
        return new RuntimeError(code, `Google Sheets API error: ${apiMessage}`);
    }
    if (error instanceof Error) {
        return new RuntimeError(code, error.message);
    }
    return new RuntimeError(code, fallback);
}

/**
 * Appends a single row to the first table found in the given sheet.
 * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append
 */
export async function appendRow(
    spreadsheetId: string,
    sheetName: string,
    values: string[],
    context: FunctionContext
): Promise<SheetsUpdateResult> {
    try {
        const http = await getSheetsHttpClient(context);
        const response = await http.post(
            `/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(sheetName)}:append`,
            { values: [values] },
            { params: { valueInputOption: "USER_ENTERED", insertDataOption: "INSERT_ROWS" } }
        );
        const updates = response.data?.updates ?? {};
        return SheetsUpdateResultSchema.parse({
            spreadsheetId: response.data?.spreadsheetId ?? spreadsheetId,
            updatedRange: updates.updatedRange ?? "",
            updatedRows: updates.updatedRows ?? 0,
            updatedColumns: updates.updatedColumns ?? 0,
            updatedCells: updates.updatedCells ?? 0,
        });
    } catch (error: any) {
        throw toRuntimeError(error, "ERROR_APPENDING_SHEETS_ROW", "Failed to append the row.");
    }
}

/**
 * Overwrites the values of a range in A1 notation.
 * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/update
 */
export async function updateRange(
    spreadsheetId: string,
    range: string,
    values: string[][],
    context: FunctionContext
): Promise<SheetsUpdateResult> {
    try {
        const http = await getSheetsHttpClient(context);
        const response = await http.put(
            `/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
            { range, values },
            { params: { valueInputOption: "USER_ENTERED" } }
        );
        return SheetsUpdateResultSchema.parse({
            spreadsheetId: response.data?.spreadsheetId ?? spreadsheetId,
            updatedRange: response.data?.updatedRange ?? range,
            updatedRows: response.data?.updatedRows ?? 0,
            updatedColumns: response.data?.updatedColumns ?? 0,
            updatedCells: response.data?.updatedCells ?? 0,
        });
    } catch (error: any) {
        throw toRuntimeError(error, "ERROR_UPDATING_SHEETS_RANGE", "Failed to update the range.");
    }
}

/**
 * Reads the values of a range in A1 notation.
 * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get
 */
export async function getRange(
    spreadsheetId: string,
    range: string,
    context: FunctionContext
): Promise<SheetsValueRange> {
    try {
        const http = await getSheetsHttpClient(context);
        const response = await http.get(
            `/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`
        );
        return SheetsValueRangeSchema.parse({
            range: response.data?.range ?? range,
            majorDimension: response.data?.majorDimension ?? "ROWS",
            values: (response.data?.values ?? []).map((row: unknown[]) => row.map((cell) => String(cell ?? ""))),
        });
    } catch (error: any) {
        throw toRuntimeError(error, "ERROR_READING_SHEETS_RANGE", "Failed to read the range.");
    }
}

/**
 * Converts a 1-based column index into its A1 column letters (1 -> A, 27 -> AA).
 */
function columnIndexToLetters(index: number): string {
    let letters = "";
    let remaining = index;
    while (remaining > 0) {
        const modulo = (remaining - 1) % 26;
        letters = String.fromCharCode(65 + modulo) + letters;
        remaining = Math.floor((remaining - 1) / 26);
    }
    return letters;
}

/**
 * Converts A1 column letters into their 1-based index (A -> 1, AA -> 27).
 */
function columnLettersToIndex(letters: string): number {
    let index = 0;
    for (const char of letters.toUpperCase()) {
        index = index * 26 + (char.charCodeAt(0) - 64);
    }
    return index;
}

/**
 * Finds the first row in a sheet whose cell in the given column matches `value`.
 * `column` may be given as an A1 column letter (e.g. "B") or a 1-based index.
 */
export async function lookupRow(
    spreadsheetId: string,
    sheetName: string,
    column: string,
    value: string,
    context: FunctionContext
): Promise<SheetsRow> {
    try {
        const valueRange = await getRange(spreadsheetId, sheetName, context);
        const columnIndex = /^[0-9]+$/.test(column.trim())
            ? Number(column.trim())
            : columnLettersToIndex(column.trim());

        if (columnIndex < 1) {
            throw new RuntimeError("INVALID_SHEETS_COLUMN", `Invalid column reference: ${column}`);
        }

        for (let rowOffset = 0; rowOffset < valueRange.values.length; rowOffset++) {
            const row = valueRange.values[rowOffset];
            if ((row[columnIndex - 1] ?? "") === value) {
                const rowNumber = rowOffset + 1;
                const columnLetters = columnIndexToLetters(columnIndex);
                return SheetsRowSchema.parse({
                    spreadsheetId,
                    range: `${sheetName}!A${rowNumber}:${columnLetters}${rowNumber}`,
                    rowNumber,
                    matched: true,
                    values: row,
                });
            }
        }

        return SheetsRowSchema.parse({
            spreadsheetId,
            range: sheetName,
            rowNumber: null,
            matched: false,
            values: [],
        });
    } catch (error: any) {
        throw toRuntimeError(error, "ERROR_LOOKING_UP_SHEETS_ROW", "Failed to look up the row.");
    }
}

/**
 * Clears the values of a range in A1 notation, keeping formatting.
 * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/clear
 */
export async function clearRange(
    spreadsheetId: string,
    range: string,
    context: FunctionContext
): Promise<boolean> {
    try {
        const http = await getSheetsHttpClient(context);
        await http.post(`/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:clear`, {});
        return true;
    } catch (error: any) {
        throw toRuntimeError(error, "ERROR_CLEARING_SHEETS_RANGE", "Failed to clear the range.");
    }
}

/**
 * Sends a batchUpdate request to the spreadsheet.
 * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/batchUpdate
 */
export async function batchUpdate(
    spreadsheetId: string,
    requests: Record<string, unknown>[],
    context: FunctionContext
): Promise<SheetsBatchResult> {
    try {
        const http = await getSheetsHttpClient(context);
        const response = await http.post(`/${encodeURIComponent(spreadsheetId)}:batchUpdate`, { requests });
        return SheetsBatchResultSchema.parse({
            spreadsheetId: response.data?.spreadsheetId ?? spreadsheetId,
            replies: (response.data?.replies ?? []).map((reply: unknown) =>
                reply && typeof reply === "object" ? (reply as Record<string, unknown>) : {}
            ),
        });
    } catch (error: any) {
        throw toRuntimeError(error, "ERROR_BATCH_UPDATING_SHEETS", "Failed to apply the batch update.");
    }
}

/**
 * Adds a new sheet (tab) to the spreadsheet via a batchUpdate addSheet request.
 */
export async function createSheet(
    spreadsheetId: string,
    title: string,
    context: FunctionContext
): Promise<SheetsSheet> {
    try {
        const result = await batchUpdate(spreadsheetId, [{ addSheet: { properties: { title } } }], context);
        const properties = (result.replies[0]?.addSheet as { properties?: Record<string, any> } | undefined)
            ?.properties;
        if (!properties) {
            throw new RuntimeError("ERROR_CREATING_SHEETS_SHEET", "Google Sheets did not return the created sheet.");
        }
        return SheetsSheetSchema.parse({
            sheetId: properties.sheetId,
            title: properties.title,
            index: properties.index ?? null,
            sheetType: properties.sheetType ?? null,
            rowCount: properties.gridProperties?.rowCount ?? null,
            columnCount: properties.gridProperties?.columnCount ?? null,
        });
    } catch (error: any) {
        throw toRuntimeError(error, "ERROR_CREATING_SHEETS_SHEET", "Failed to create the sheet.");
    }
}
