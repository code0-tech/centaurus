import { PlainValue, RuntimeError } from "@code0-tech/hercules";
import { airtableRequest, tablePath } from "./client.js";
import { AirtableFieldMapType } from "./data_types/airtableFieldMap.js";
import { AirtableRecordType } from "./data_types/airtableRecord.js";
import { AirtableSortType } from "./data_types/airtableSort.js";

/** Airtable creates, updates and deletes at most 10 records per request. */
export const MAX_RECORDS_PER_WRITE = 10;
/** Airtable returns at most 100 records per page. */
export const MAX_PAGE_SIZE = 100;

export interface RawAirtableRecord {
    id: string;
    createdTime: string;
    fields?: Record<string, unknown>;
}

export function handleAirtableError(error: any, fallbackCode: string, fallbackMessage: string): never {
    if (error instanceof RuntimeError) throw error;
    if (typeof error === "string") throw new RuntimeError(fallbackCode, error);
    throw new RuntimeError(fallbackCode, error?.message || fallbackMessage);
}

/**
 * A flow hands fields over either as an object or as a JSON object string (e.g.
 * built with a text node) - both end up as the same field map.
 */
export function parseFieldMap(value: unknown, name = "fields"): AirtableFieldMapType {
    const parsed = parseJson(value, name);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new RuntimeError("AIRTABLE_INVALID_FIELDS", `The ${name} have to be an object of field names and values.`);
    }
    return parsed as AirtableFieldMapType;
}

export function parseFieldMapList(value: unknown): AirtableFieldMapType[] {
    const parsed = parseJson(value, "records");
    if (!Array.isArray(parsed)) {
        throw new RuntimeError("AIRTABLE_INVALID_FIELDS", "The records have to be a list of field maps.");
    }
    return parsed.map((entry, index) => {
        // Accept `{ fields: {...} }` as well, the shape Airtable itself uses.
        const fields =
            entry && typeof entry === "object" && !Array.isArray(entry) && "fields" in entry && isPlainObject(entry.fields)
                ? entry.fields
                : entry;
        return parseFieldMap(fields, `fields of record ${index + 1}`);
    });
}

export function parseSort(value: unknown): AirtableSortType[] | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = parseJson(value, "sort");
    const list = Array.isArray(parsed) ? parsed : [parsed];

    return list.map((entry) => {
        const field = typeof entry === "string" ? entry : (entry as AirtableSortType | undefined)?.field;
        const direction = typeof entry === "string" ? undefined : (entry as AirtableSortType | undefined)?.direction;
        if (typeof field !== "string" || !field.trim()) {
            throw new RuntimeError("AIRTABLE_INVALID_SORT", "Every sort needs the field it sorts by.");
        }
        return { field: field.trim(), direction: normalizeDirection(direction) };
    });
}

export function normalizeDirection(direction: unknown): "asc" | "desc" {
    if (direction === undefined || direction === null || direction === "") return "asc";
    const normalized = String(direction).trim().toLowerCase();
    if (normalized === "asc" || normalized === "desc") return normalized;
    throw new RuntimeError("AIRTABLE_INVALID_SORT", `The sort direction has to be "asc" or "desc", not "${direction}".`);
}

function parseJson(value: unknown, name: string): unknown {
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        throw new RuntimeError("AIRTABLE_INVALID_FIELDS", `The ${name} are not valid JSON.`);
    }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export function mapRecord(record: RawAirtableRecord): AirtableRecordType {
    return {
        id: record.id,
        createdTime: record.createdTime,
        fields: (record.fields ?? {}) as AirtableFieldMapType,
    };
}

/** A string literal for an Airtable formula. */
export function formulaString(value: string): string {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** A field reference for an Airtable formula, e.g. `{First name}`. */
export function formulaField(name: string): string {
    return `{${name.trim().replace(/\\/g, "\\\\").replace(/}/g, "\\}")}}`;
}

/**
 * Airtable's `DATETIME_PARSE` reads `YYYY-MM-DD HH:mm:ss` as UTC. Seconds are
 * enough: the poller deduplicates what an earlier bound lets through twice.
 */
export function formulaDate(ms: number): string {
    const iso = new Date(Math.floor(ms / 1000) * 1000).toISOString();
    return `DATETIME_PARSE(${formulaString(iso.slice(0, 19).replace("T", " "))}, "YYYY-MM-DD HH:mm:ss")`;
}

export interface ListRecordsOptions {
    filterByFormula?: string;
    view?: string;
    sort?: AirtableSortType[];
    /** Stop after this many records. Undefined reads every page. */
    maxRecords?: number;
}

/**
 * Read records page by page. The POST variant takes the options in the body,
 * so a long formula does not run into URL length limits.
 */
export async function listRecords(
    apiToken: string,
    baseId: string,
    tableId: string,
    options: ListRecordsOptions = {}
): Promise<AirtableRecordType[]> {
    const path = `${tablePath(baseId, tableId)}/listRecords`;
    const records: AirtableRecordType[] = [];
    let offset: string | undefined;

    do {
        const remaining = options.maxRecords === undefined ? MAX_PAGE_SIZE : options.maxRecords - records.length;
        const body: Record<string, unknown> = {
            pageSize: Math.min(MAX_PAGE_SIZE, remaining),
            ...(options.filterByFormula ? { filterByFormula: options.filterByFormula } : {}),
            ...(options.view ? { view: options.view } : {}),
            ...(options.sort?.length ? { sort: options.sort } : {}),
            ...(options.maxRecords !== undefined ? { maxRecords: options.maxRecords } : {}),
            ...(offset ? { offset } : {}),
        };

        const page = await airtableRequest<{ records: RawAirtableRecord[]; offset?: string }>(apiToken, path, {
            method: "POST",
            body,
        });

        records.push(...(page.records ?? []).map(mapRecord));
        offset = page.offset;
    } while (offset && (options.maxRecords === undefined || records.length < options.maxRecords));

    return options.maxRecords === undefined ? records : records.slice(0, options.maxRecords);
}

export function chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}

/**
 * Replace `undefined` with `null` throughout a payload. A protobuf Value has no
 * representation for `undefined`, and a key that never reaches Aquila has no
 * reference in the execution value store.
 */
export function toEventPayload<T>(value: T): PlainValue {
    if (value === undefined || value === null) return null;
    if (Array.isArray(value)) return value.map((entry) => toEventPayload(entry));
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, toEventPayload(entry)])
        );
    }

    return value as PlainValue;
}

/** Optional booleans arrive as `undefined`, `null`, a boolean or a string. */
export function optionalBoolean(value: unknown, fallback: boolean): boolean {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "string") return value.trim().toLowerCase() === "true";
    return Boolean(value);
}
