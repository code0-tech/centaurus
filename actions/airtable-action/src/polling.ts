import { Action, CodeZeroEvent, PlainValue } from "@code0-tech/hercules";
import type { ActionFlow } from "@code0-tech/tucana/aquila";
import { toAllowedValue } from "@code0-tech/tucana/helpers";
import { toEventPayload } from "./helpers.js";
import { ListRecordsFn, parseWatchedFields, TableWatcher, WatchKind, watchKey, WatchTarget } from "./watcher.js";

/** The triggers of this action and what each of them watches a table for. */
export const EVENT_KINDS: Record<string, WatchKind> = {
    AirtableRecordCreated: "created",
    AirtableRecordUpdated: "updated",
};

export const DEFAULT_POLL_INTERVAL_MS = 60 * 1000;
export const MIN_POLL_INTERVAL_MS = 10 * 1000;

/** The poll interval from `AIRTABLE_POLL_INTERVAL_SECONDS`, at least {@link MIN_POLL_INTERVAL_MS}. */
export function pollIntervalMs(value = process.env.AIRTABLE_POLL_INTERVAL_SECONDS): number {
    const seconds = Number(value);
    if (!value || !Number.isFinite(seconds)) return DEFAULT_POLL_INTERVAL_MS;
    return Math.max(seconds * 1000, MIN_POLL_INTERVAL_MS);
}

/** A flow's setting as a plain value, or `undefined` if it is not set. */
function setting(flow: ActionFlow, identifier: string): PlainValue | undefined {
    const encoded = flow.settings.find((candidate) => candidate.flowSettingId === identifier)?.value;
    return encoded ? toAllowedValue(encoded) : undefined;
}

/** A flow's text setting, or `undefined` if it is not set. */
function textSetting(flow: ActionFlow, identifier: string): string | undefined {
    const value = setting(flow, identifier);
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/**
 * What a trigger flow watches, or `undefined` if it is no Airtable trigger or
 * lacks the token, base or table.
 */
export function targetOf(flow: ActionFlow): WatchTarget | undefined {
    const kind = EVENT_KINDS[flow.type];
    if (!kind) return undefined;

    const apiToken = textSetting(flow, "apiToken");
    const baseId = textSetting(flow, "baseId");
    const tableId = textSetting(flow, "tableId");
    if (!apiToken || !baseId || !tableId) return undefined;

    return {
        kind,
        apiToken,
        baseId,
        tableId,
        watchedFields: kind === "updated" ? parseWatchedFields(textSetting(flow, "watchedFields")) : [],
    };
}

interface Poller {
    target: WatchTarget;
    watcher: TableWatcher;
    timer?: NodeJS.Timeout;
    stopped: boolean;
}

export interface AirtablePollingOptions {
    intervalMs?: number;
    /** How a watcher reads the table; swapped out by tests. */
    listRecords?: ListRecordsFn;
    reportError?: (message: string, error?: unknown) => void;
}

/**
 * Polls Airtable tables and fires the matching flows.
 *
 * Every trigger flow names the token, base and table it watches in its
 * settings, so one poller is kept per distinct combination in use - flows that
 * watch the same table the same way share it. The pollers follow the flows
 * Aquila sends: they are started and stopped whenever a flow changes. A poll
 * waits for the previous one, so a slow table is never polled twice at once.
 */
export class AirtablePollingManager {
    private readonly pollers = new Map<string, Poller>();
    private readonly intervalMs: number;
    private readonly listRecords?: ListRecordsFn;
    private readonly reportError: (message: string, error?: unknown) => void;
    private started = false;

    constructor(
        private readonly action: Action,
        options: AirtablePollingOptions = {}
    ) {
        this.intervalMs = options.intervalMs ?? pollIntervalMs();
        this.listRecords = options.listRecords;
        this.reportError =
            options.reportError ??
            ((message, error) =>
                console.error(`Airtable polling: ${message}`, error instanceof Error ? error.message : (error ?? "")));
    }

    start(): void {
        if (this.started) {
            return;
        }
        this.started = true;
        this.action.on(CodeZeroEvent.connected, this.sync);
        this.action.on(CodeZeroEvent.flowUpdated, this.sync);
        this.action.on(CodeZeroEvent.flowDeleted, this.sync);
        this.sync();
    }

    stop(): void {
        this.started = false;
        this.action.off(CodeZeroEvent.connected, this.sync);
        this.action.off(CodeZeroEvent.flowUpdated, this.sync);
        this.action.off(CodeZeroEvent.flowDeleted, this.sync);
        for (const poller of this.pollers.values()) {
            this.halt(poller);
        }
        this.pollers.clear();
    }

    /** The tables currently polled, by {@link watchKey}. */
    get activeKeys(): string[] {
        return [...this.pollers.keys()];
    }

    /** Starts and stops pollers to match the tables the trigger flows watch. */
    readonly sync = (): void => {
        const wanted = new Map<string, WatchTarget>();
        for (const flow of this.action.flows.values()) {
            if (!EVENT_KINDS[flow.type]) {
                continue;
            }
            const target = targetOf(flow);
            if (target) {
                wanted.set(watchKey(target), target);
            } else {
                this.reportError(`flow ${flow.flowId} has no token, base or table; it will not trigger.`);
            }
        }

        for (const [key, poller] of this.pollers) {
            if (!wanted.has(key)) {
                this.pollers.delete(key);
                this.halt(poller);
            }
        }

        for (const [key, target] of wanted) {
            if (this.pollers.has(key)) {
                continue;
            }
            const poller: Poller = { target, watcher: new TableWatcher(target, this.listRecords), stopped: false };
            this.pollers.set(key, poller);
            this.schedule(key, poller);
        }
    };

    /** Polls one table and fires every flow watching it for each reported record. */
    async poll(key: string): Promise<void> {
        const poller = this.pollers.get(key);
        if (!poller) {
            return;
        }

        let records;
        try {
            records = await poller.watcher.poll();
        } catch (error) {
            this.reportError(`could not check table ${poller.target.tableId} of base ${poller.target.baseId}.`, error);
            return;
        }

        for (const record of records) {
            if (poller.stopped) {
                return;
            }
            const payload = toEventPayload(record);
            for (const flow of this.action.flows.values()) {
                const target = targetOf(flow);
                if (!target || watchKey(target) !== key) {
                    continue;
                }
                this.action
                    .fire(flow.flowId, payload)
                    .catch((error) => this.reportError(`flow ${flow.flowId} failed.`, error));
            }
        }
    }

    private schedule(key: string, poller: Poller): void {
        if (poller.stopped) {
            return;
        }
        poller.timer = setTimeout(() => {
            void this.poll(key).finally(() => this.schedule(key, poller));
        }, this.intervalMs);
        poller.timer.unref?.();
    }

    private halt(poller: Poller): void {
        poller.stopped = true;
        if (poller.timer) {
            clearTimeout(poller.timer);
        }
    }
}
