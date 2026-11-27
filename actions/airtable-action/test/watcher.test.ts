import "reflect-metadata";
import { describe, expect, it } from "vitest";

import { AirtableRecordType } from "../src/data_types/airtableRecord.js";
import { OVERLAP_MS, parseWatchedFields, TableWatcher, watchFormula, watchKey, WatchTarget } from "../src/watcher.js";

const START = Date.parse("2026-05-01T12:00:00.000Z");

const created: WatchTarget = { kind: "created", apiToken: "pat", baseId: "appX", tableId: "tblY", watchedFields: [] };
const updated: WatchTarget = { ...created, kind: "updated" };

const at = (offsetMs: number) => new Date(START + offsetMs).toISOString();
const record = (id: string, createdOffsetMs: number, fields: Record<string, unknown> = {}): AirtableRecordType => ({
    id,
    createdTime: at(createdOffsetMs),
    fields,
});

/** A watcher whose clock and Airtable answers the test controls. */
function harness(target: WatchTarget) {
    let now = START;
    const formulas: string[] = [];
    let answer: AirtableRecordType[] = [];
    const watcher = new TableWatcher(
        target,
        async (_target, formula) => {
            formulas.push(formula);
            return answer;
        },
        () => now
    );

    return {
        watcher,
        formulas,
        advance: (ms: number) => (now += ms),
        answer: (records: AirtableRecordType[]) => (answer = records),
    };
}

describe("formulas", () => {
    it("asks for records created after the bound", () => {
        expect(watchFormula(created, START)).toEqual(
            'IS_AFTER(CREATED_TIME(), DATETIME_PARSE("2026-05-01 12:00:00", "YYYY-MM-DD HH:mm:ss"))'
        );
    });

    it("limits modifications to the watched fields", () => {
        expect(watchFormula({ ...updated, watchedFields: ["Status", "Owner"] }, START)).toEqual(
            'IS_AFTER(LAST_MODIFIED_TIME({Status}, {Owner}), DATETIME_PARSE("2026-05-01 12:00:00", "YYYY-MM-DD HH:mm:ss"))'
        );
        expect(watchFormula(updated, START)).toContain("LAST_MODIFIED_TIME()");
    });

    it("parses watched fields and keys them independent of order", () => {
        expect(parseWatchedFields(" Status, Owner ,,Status")).toEqual(["Status", "Owner"]);
        expect(watchKey({ ...updated, watchedFields: ["A", "B"] })).toEqual(watchKey({ ...updated, watchedFields: ["B", "A"] }));
        expect(watchKey(created)).not.toEqual(watchKey(updated));
    });
});

describe("created records", () => {
    it("reports a new record once although the overlap returns it again", async () => {
        const h = harness(created);

        h.advance(60_000);
        h.answer([record("rec1", 30_000)]);
        expect((await h.watcher.poll()).map((r) => r.id)).toEqual(["rec1"]);

        h.advance(60_000);
        h.answer([record("rec1", 30_000), record("rec2", 90_000)]);
        expect((await h.watcher.poll()).map((r) => r.id)).toEqual(["rec2"]);
    });

    it("never reports records from before the flow started", async () => {
        const h = harness(created);

        h.advance(60_000);
        h.answer([record("old", -500), record("new", 10)]);
        expect((await h.watcher.poll()).map((r) => r.id)).toEqual(["new"]);
        expect(h.formulas[0]).toContain("2026-05-01 12:00:00");
    });

    it("trails the previous poll by the overlap", async () => {
        const h = harness(created);

        h.advance(5 * 60_000);
        await h.watcher.poll();
        h.advance(60_000);
        await h.watcher.poll();

        expect(h.formulas[1]).toContain(at(5 * 60_000 - OVERLAP_MS).slice(0, 19).replace("T", " "));
    });

    it("keeps the bound when a poll fails", async () => {
        let fail = false;
        let now = START;
        const formulas: string[] = [];
        const watcher = new TableWatcher(
            created,
            async (_target, formula) => {
                formulas.push(formula);
                if (fail) throw new Error("boom");
                return [];
            },
            () => now
        );

        now += 5 * 60_000;
        await watcher.poll();
        fail = true;
        now += 60_000;
        await expect(watcher.poll()).rejects.toThrow("boom");
        fail = false;
        now += 60_000;
        await watcher.poll();

        expect(formulas[2]).toEqual(formulas[1]);
    });

    it("reports oldest first", async () => {
        const h = harness(created);

        h.advance(60_000);
        h.answer([record("b", 20_000), record("a", 10_000)]);
        expect((await h.watcher.poll()).map((r) => r.id)).toEqual(["a", "b"]);
    });
});

describe("updated records", () => {
    it("reports a changed record, but not the same state twice", async () => {
        const h = harness(updated);

        h.advance(60_000);
        h.answer([record("rec1", -86_400_000, { Status: "Todo" })]);
        expect(await h.watcher.poll()).toHaveLength(1);

        h.advance(30_000);
        expect(await h.watcher.poll()).toHaveLength(0);

        h.answer([record("rec1", -86_400_000, { Status: "Done" })]);
        h.advance(30_000);
        expect(await h.watcher.poll()).toHaveLength(1);
    });

    it("treats a record created in the window as a creation", async () => {
        const h = harness(updated);

        h.advance(60_000);
        h.answer([record("rec1", 30_000, { Status: "Todo" })]);
        expect(await h.watcher.poll()).toHaveLength(0);

        h.answer([record("rec1", 30_000, { Status: "Done" })]);
        h.advance(60_000);
        expect(await h.watcher.poll()).toHaveLength(1);
    });

    it("only compares the watched fields", async () => {
        const h = harness({ ...updated, watchedFields: ["Status"] });

        h.advance(60_000);
        h.answer([record("rec1", -86_400_000, { Status: "Todo", Notes: "a" })]);
        expect(await h.watcher.poll()).toHaveLength(1);

        h.answer([record("rec1", -86_400_000, { Status: "Todo", Notes: "b" })]);
        h.advance(30_000);
        expect(await h.watcher.poll()).toHaveLength(0);
    });

    it("does not depend on the order of the fields", async () => {
        const h = harness(updated);

        h.advance(60_000);
        h.answer([record("rec1", -86_400_000, { A: 1, B: { x: 1, y: 2 } })]);
        await h.watcher.poll();

        h.answer([record("rec1", -86_400_000, { B: { y: 2, x: 1 }, A: 1 })]);
        h.advance(30_000);
        expect(await h.watcher.poll()).toHaveLength(0);
    });
});
