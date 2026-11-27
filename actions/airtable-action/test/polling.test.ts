import "reflect-metadata";
import { EventEmitter } from "node:events";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";
import type { ActionFlow } from "@code0-tech/tucana/aquila";
import { constructValue } from "@code0-tech/tucana/helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AirtableRecordType } from "../src/data_types/airtableRecord.js";
import { AirtablePollingManager, pollIntervalMs, targetOf } from "../src/polling.js";
import { ListRecordsFn, watchKey, WatchTarget } from "../src/watcher.js";

const START = Date.parse("2026-05-01T12:00:00.000Z");
const INTERVAL = 60_000;

const flow = (flowId: number, type: string, settings: Record<string, string>): ActionFlow =>
    ({
        flowId: BigInt(flowId),
        projectId: 1n,
        type,
        settings: Object.entries(settings).map(([flowSettingId, value]) => ({
            flowSettingId,
            value: constructValue(value),
        })),
    }) as unknown as ActionFlow;

const table = { apiToken: "pat", baseId: "appX", tableId: "tblY" };

/** Just enough of an Action: flows, events and fire. */
function fakeAction(flows: ActionFlow[] = []) {
    const emitter = new EventEmitter();
    const action = {
        flows: new Map(flows.map((entry) => [entry.flowId, entry])),
        on: emitter.on.bind(emitter),
        off: emitter.off.bind(emitter),
        emit: emitter.emit.bind(emitter),
        fire: vi.fn(async (_flowId: bigint, _payload?: unknown) => null),
    };
    return action as typeof action & Action;
}

const record = (id: string, createdOffsetMs: number): AirtableRecordType => ({
    id,
    createdTime: new Date(START + createdOffsetMs).toISOString(),
    fields: { Name: id },
});

/** A table read that answers what the test puts in and records who asked. */
function fakeTables() {
    const answers = new Map<string, AirtableRecordType[]>();
    const asked: WatchTarget[] = [];
    const listRecords: ListRecordsFn = async (target) => {
        asked.push(target);
        return answers.get(target.apiToken) ?? [];
    };
    return { answers, asked, listRecords };
}

let manager: AirtablePollingManager | undefined;

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
});

afterEach(() => {
    manager?.stop();
    manager = undefined;
    vi.useRealTimers();
});

function startManager(action: Action, tables = fakeTables(), reportError = vi.fn()) {
    manager = new AirtablePollingManager(action, { intervalMs: INTERVAL, listRecords: tables.listRecords, reportError });
    manager.start();
    return { manager, tables, reportError };
}

describe("targetOf", () => {
    it("reads the watched table from the settings", () => {
        expect(targetOf(flow(1, "AirtableRecordCreated", { ...table, watchedFields: "Status" }))).toEqual({
            kind: "created",
            ...table,
            watchedFields: [],
        });
        expect(targetOf(flow(1, "AirtableRecordUpdated", { ...table, watchedFields: "Status, Owner" }))).toEqual({
            kind: "updated",
            ...table,
            watchedFields: ["Status", "Owner"],
        });
    });

    it("has no target without token, base and table or for other flows", () => {
        expect(targetOf(flow(1, "AirtableRecordCreated", { apiToken: "pat", baseId: "appX" }))).toBeUndefined();
        expect(targetOf(flow(1, "AirtableRecordCreated", { ...table, tableId: "  " }))).toBeUndefined();
        expect(targetOf(flow(1, "SomethingElse", table))).toBeUndefined();
    });
});

describe("pollIntervalMs", () => {
    it("defaults to a minute and polls at most every 10 seconds", () => {
        expect(pollIntervalMs(undefined)).toBe(60_000);
        expect(pollIntervalMs("nope")).toBe(60_000);
        expect(pollIntervalMs("120")).toBe(120_000);
        expect(pollIntervalMs("1")).toBe(10_000);
    });
});

describe("AirtablePollingManager", () => {
    it("keeps one poller per distinct table and filter", () => {
        const action = fakeAction([
            flow(1, "AirtableRecordCreated", table),
            flow(2, "AirtableRecordCreated", table),
            flow(3, "AirtableRecordUpdated", { ...table, watchedFields: "Status" }),
            flow(4, "SomethingElse", {}),
        ]);
        const { manager } = startManager(action);

        expect(manager.activeKeys).toHaveLength(2);
    });

    it("reports a trigger flow it cannot poll for", () => {
        const action = fakeAction([flow(7, "AirtableRecordCreated", { apiToken: "pat" })]);
        const { manager, reportError } = startManager(action);

        expect(manager.activeKeys).toHaveLength(0);
        expect(reportError).toHaveBeenCalledWith(expect.stringContaining("flow 7"));
    });

    it("follows flow updates and deletions", () => {
        const action = fakeAction([flow(1, "AirtableRecordCreated", table)]);
        const { manager } = startManager(action);

        action.flows.set(2n, flow(2, "AirtableRecordCreated", { ...table, tableId: "tblZ" }));
        action.emit(CodeZeroEvent.flowUpdated);
        expect(manager.activeKeys).toHaveLength(2);

        action.flows.delete(1n);
        action.emit(CodeZeroEvent.flowDeleted);
        expect(manager.activeKeys).toEqual([watchKey({ kind: "created", ...table, tableId: "tblZ", watchedFields: [] })]);
    });

    it("fires every flow watching the table, once per new record", async () => {
        const action = fakeAction([
            flow(1, "AirtableRecordCreated", table),
            flow(2, "AirtableRecordCreated", table),
            flow(3, "AirtableRecordCreated", { ...table, apiToken: "other" }),
        ]);
        const { tables } = startManager(action);
        tables.answers.set("pat", [record("rec1", 30_000)]);

        await vi.advanceTimersByTimeAsync(INTERVAL);
        expect(action.fire.mock.calls.map(([flowId]) => flowId).sort()).toEqual([1n, 2n]);
        expect(action.fire.mock.calls[0][1]).toEqual(record("rec1", 30_000));

        // The overlap returns the record again; it is not reported twice.
        await vi.advanceTimersByTimeAsync(INTERVAL);
        expect(action.fire).toHaveBeenCalledTimes(2);
    });

    it("polls on the interval, one poll at a time", async () => {
        const action = fakeAction([flow(1, "AirtableRecordCreated", table)]);
        const { tables } = startManager(action);

        expect(tables.asked).toHaveLength(0);
        await vi.advanceTimersByTimeAsync(INTERVAL * 3);
        expect(tables.asked).toHaveLength(3);
    });

    it("keeps polling after a failed poll", async () => {
        const action = fakeAction([flow(1, "AirtableRecordCreated", table)]);
        let calls = 0;
        const reportError = vi.fn();
        manager = new AirtablePollingManager(action, {
            intervalMs: INTERVAL,
            reportError,
            listRecords: async () => {
                calls += 1;
                if (calls === 1) throw new Error("boom");
                return [];
            },
        });
        manager.start();

        await vi.advanceTimersByTimeAsync(INTERVAL * 2);
        expect(calls).toBe(2);
        expect(reportError).toHaveBeenCalledWith(expect.stringContaining("tblY"), expect.any(Error));
    });

    it("stops polling and listening on stop", async () => {
        const action = fakeAction([flow(1, "AirtableRecordCreated", table)]);
        const { manager, tables } = startManager(action);

        manager.stop();
        await vi.advanceTimersByTimeAsync(INTERVAL * 2);
        action.emit(CodeZeroEvent.flowUpdated);

        expect(tables.asked).toHaveLength(0);
        expect(manager.activeKeys).toHaveLength(0);
    });

    it("reports a failing flow without stopping the others", async () => {
        const action = fakeAction([flow(1, "AirtableRecordCreated", table), flow(2, "AirtableRecordCreated", table)]);
        action.fire.mockRejectedValueOnce(new Error("flow broke"));
        const { tables, reportError } = startManager(action);
        tables.answers.set("pat", [record("rec1", 30_000)]);

        await vi.advanceTimersByTimeAsync(INTERVAL);

        expect(action.fire).toHaveBeenCalledTimes(2);
        expect(reportError).toHaveBeenCalledWith(expect.stringContaining("failed"), expect.any(Error));
    });
});
