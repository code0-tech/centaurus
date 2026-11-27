import { AirtableRecordType } from "./data_types/airtableRecord.js";
import { formulaDate, formulaField, listRecords } from "./helpers.js";

/**
 * Airtable has no push events for personal access tokens, so a watched table is
 * polled: every poll asks for the records created (or modified) after a lower
 * bound, using Airtable's own `CREATED_TIME()` / `LAST_MODIFIED_TIME()`.
 *
 * The bound trails the previous poll by {@link OVERLAP_MS}, so a clock that is
 * off between this host and Airtable, or a record that only became visible a
 * moment later, is not lost. What the overlap lets through twice is filtered
 * out by remembering what was already reported.
 */
export type WatchKind = "created" | "updated";

export interface WatchTarget {
    kind: WatchKind;
    apiToken: string;
    baseId: string;
    tableId: string;
    /** Only for `updated`: the fields whose changes count. Empty means every field. */
    watchedFields: string[];
}

export type ListRecordsFn = (target: WatchTarget, filterByFormula: string) => Promise<AirtableRecordType[]>;

export const OVERLAP_MS = 60 * 1000;

const defaultList: ListRecordsFn = (target, filterByFormula) =>
    listRecords(target.apiToken, target.baseId, target.tableId, { filterByFormula });

/** Two flows with the same token, table and filter share one watcher. */
export function watchKey(target: WatchTarget): string {
    return JSON.stringify([
        target.kind,
        target.apiToken,
        target.baseId,
        target.tableId,
        target.kind === "updated" ? [...target.watchedFields].sort() : [],
    ]);
}

export function parseWatchedFields(value: string | undefined): string[] {
    if (!value) return [];
    return Array.from(new Set(value.split(",").map((field) => field.trim()).filter(Boolean)));
}

export function watchFormula(target: WatchTarget, sinceMs: number): string {
    if (target.kind === "created") {
        return `IS_AFTER(CREATED_TIME(), ${formulaDate(sinceMs)})`;
    }
    const fields = target.watchedFields.map(formulaField).join(", ");
    return `IS_AFTER(LAST_MODIFIED_TIME(${fields}), ${formulaDate(sinceMs)})`;
}

interface SeenRecord {
    signature: string;
    seenAt: number;
}

export class TableWatcher {
    private readonly startedAt: number;
    private lastPollAt: number | undefined;
    private readonly seen = new Map<string, SeenRecord>();

    constructor(
        readonly target: WatchTarget,
        private readonly list: ListRecordsFn = defaultList,
        private readonly now: () => number = Date.now
    ) {
        // Only what happens after the flow started listening is reported.
        this.startedAt = now();
    }

    /**
     * Ask Airtable for what changed since the last poll and return the records
     * to report, oldest first. A failed poll throws and leaves the bound where
     * it was, so the next poll covers its window as well.
     */
    async poll(): Promise<AirtableRecordType[]> {
        const pollAt = this.now();
        const since = Math.max(this.startedAt, (this.lastPollAt ?? this.startedAt) - OVERLAP_MS);

        const records = await this.list(this.target, watchFormula(this.target, since));
        this.lastPollAt = pollAt;

        const report = records.filter((record) => this.isNew(record, since, pollAt));
        this.forgetOlderThan(since);

        return report.sort((a, b) => Date.parse(a.createdTime) - Date.parse(b.createdTime));
    }

    private isNew(record: AirtableRecordType, since: number, pollAt: number): boolean {
        const previous = this.seen.get(record.id);
        const signature = this.target.kind === "created" ? "" : this.signature(record);
        this.seen.set(record.id, { signature, seenAt: pollAt });

        if (this.target.kind === "created") {
            return !previous && Date.parse(record.createdTime) >= this.startedAt;
        }

        if (previous) return previous.signature !== signature;

        // A record created inside the window is a creation, not an update - it
        // is remembered so that the next change to it is reported.
        return Date.parse(record.createdTime) < since;
    }

    /**
     * A record last seen before the current bound cannot come back through the
     * overlap any more - only through a new change, which is reported anyway.
     */
    private forgetOlderThan(since: number): void {
        for (const [id, entry] of this.seen) {
            if (entry.seenAt < since) this.seen.delete(id);
        }
    }

    private signature(record: AirtableRecordType): string {
        const fields = this.target.watchedFields;
        const values =
            fields.length === 0
                ? record.fields
                : Object.fromEntries(fields.map((field) => [field, record.fields[field] ?? null]));
        return stableStringify(values);
    }
}

export function stableStringify(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    if (value && typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([, entry]) => entry !== undefined)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
        return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(",")}}`;
    }
    return JSON.stringify(value ?? null);
}
