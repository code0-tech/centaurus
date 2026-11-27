import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RuntimeError } from "@code0-tech/hercules";

import { airtableRequest, transport } from "../src/client.js";
import { formulaDate, formulaField, formulaString, listRecords, parseFieldMap, parseFieldMapList, parseSort } from "../src/helpers.js";

import { AirtableCreateRecordFunction } from "../src/functions/records/airtableCreateRecord.js";
import { AirtableCreateRecordsFunction } from "../src/functions/records/airtableCreateRecords.js";
import { AirtableGetRecordFunction } from "../src/functions/records/airtableGetRecord.js";
import { AirtableUpdateRecordFunction } from "../src/functions/records/airtableUpdateRecord.js";
import { AirtableDeleteRecordFunction } from "../src/functions/records/airtableDeleteRecord.js";
import { AirtableListRecordsFunction } from "../src/functions/records/airtableListRecords.js";
import { AirtableFindRecordFunction, findFormula } from "../src/functions/records/airtableFindRecord.js";
import { AirtableUpsertRecordFunction } from "../src/functions/records/airtableUpsertRecord.js";
import { AirtableListBasesFunction } from "../src/functions/meta/airtableListBases.js";
import { AirtableGetTablesFunction } from "../src/functions/meta/airtableGetTables.js";
import { AirtableCreateFieldMapFunction } from "../src/functions/utils/airtableCreateFieldMap.js";
import { AirtableCreateSortFunction } from "../src/functions/utils/airtableCreateSort.js";
import { AirtableAddAttachmentFunction } from "../src/functions/utils/airtableAddAttachment.js";

import { AirtableRecordCreated } from "../src/events/airtableRecordCreated.js";
import { AirtableRecordUpdated } from "../src/events/airtableRecordUpdated.js";

const apiFunctions = [
    AirtableCreateRecordFunction,
    AirtableCreateRecordsFunction,
    AirtableGetRecordFunction,
    AirtableUpdateRecordFunction,
    AirtableDeleteRecordFunction,
    AirtableListRecordsFunction,
    AirtableFindRecordFunction,
    AirtableUpsertRecordFunction,
    AirtableListBasesFunction,
    AirtableGetTablesFunction,
];

const events = [AirtableRecordCreated, AirtableRecordUpdated];

interface Call {
    url: URL;
    method: string;
    headers: Record<string, string>;
    body: any;
}

let calls: Call[];
let responses: (() => Response)[];

function respond(status: number, body?: unknown) {
    responses.push(() => new Response(body === undefined ? "" : JSON.stringify(body), { status }));
}

const record = (id: string, fields: Record<string, unknown> = {}, createdTime = "2026-01-01T00:00:00.000Z") => ({
    id,
    createdTime,
    fields,
});

beforeEach(() => {
    calls = [];
    responses = [];
    vi.spyOn(transport, "fetch").mockImplementation(async (input, init) => {
        calls.push({
            url: new URL(input),
            method: init.method ?? "GET",
            headers: init.headers as Record<string, string>,
            body: init.body ? JSON.parse(init.body as string) : undefined,
        });
        const next = responses.shift();
        if (!next) throw new Error(`Unexpected request to ${input}`);
        return next();
    });
    vi.spyOn(transport, "sleep").mockResolvedValue(undefined);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("personal access token", () => {
    it.each(apiFunctions)("is the first parameter of %o", (fn) => {
        const parameters = Reflect.getMetadata("hercules:function_parameters", fn) as { runtimeName: string }[];
        const signature = Reflect.getMetadata("hercules:signature", fn) as string;

        expect(parameters[0].runtimeName).toEqual("apiToken");
        expect(parameters[0]).not.toHaveProperty("optional", true);
        expect(signature.startsWith("(apiToken: string")).toBe(true);
    });

    it.each(events)("is the first setting of %o", (event) => {
        const settings = Reflect.getMetadata("hercules:flow_settings", event) as { identifier: string }[];
        const signature = Reflect.getMetadata("hercules:signature", event) as string;

        expect(settings[0].identifier).toEqual("apiToken");
        expect(settings[0]).not.toHaveProperty("optional", true);
        expect(signature.startsWith("(apiToken: string")).toBe(true);
    });

    it("is required for a request", async () => {
        await expect(airtableRequest("  ", "/meta/bases")).rejects.toMatchObject({ code: "AIRTABLE_MISSING_API_TOKEN" });
        expect(calls).toHaveLength(0);
    });

    it("is sent as bearer token", async () => {
        respond(200, { bases: [] });
        await new AirtableListBasesFunction().run(undefined, " patABC ");

        expect(calls[0].headers.Authorization).toEqual("Bearer patABC");
    });
});

describe("client", () => {
    it.each([
        [401, "AIRTABLE_UNAUTHORIZED"],
        [403, "AIRTABLE_FORBIDDEN"],
        [404, "AIRTABLE_NOT_FOUND"],
        [422, "AIRTABLE_INVALID_REQUEST"],
        [503, "AIRTABLE_SERVER_ERROR"],
    ])("maps HTTP %i to %s", async (status, code) => {
        respond(status, { error: { type: "SOME_TYPE", message: "Something went wrong" } });

        const error: any = await airtableRequest("pat", "/app/tbl").catch((e) => e);
        expect(error).toBeInstanceOf(RuntimeError);
        expect(error.code).toEqual(code);
        expect(error.message).toContain("SOME_TYPE");
        expect(error.message).toContain("(GET /v0/app/tbl)");
    });

    it("understands the short error form", async () => {
        respond(404, { error: "NOT_FOUND" });
        await expect(airtableRequest("pat", "/app/tbl")).rejects.toMatchObject({ code: "AIRTABLE_NOT_FOUND" });
    });

    it("waits out a rate limit once", async () => {
        respond(429, { errors: [] });
        respond(200, { ok: true });

        await expect(airtableRequest("pat", "/app/tbl")).resolves.toEqual({ ok: true });
        expect(transport.sleep).toHaveBeenCalledWith(30_000);
        expect(calls).toHaveLength(2);
    });

    it("gives up after a second rate limit", async () => {
        respond(429);
        respond(429);
        await expect(airtableRequest("pat", "/app/tbl")).rejects.toMatchObject({ code: "AIRTABLE_RATE_LIMITED" });
    });

    it("reports a network failure", async () => {
        vi.mocked(transport.fetch).mockRejectedValueOnce(new Error("ECONNRESET"));
        await expect(airtableRequest("pat", "/app/tbl")).rejects.toMatchObject({ code: "AIRTABLE_REQUEST_FAILED" });
    });
});

describe("field maps", () => {
    it("accepts an object or a JSON string", () => {
        expect(parseFieldMap({ Name: "A" })).toEqual({ Name: "A" });
        expect(parseFieldMap('{"Name":"A","Count":2}')).toEqual({ Name: "A", Count: 2 });
    });

    it("rejects what is no object", () => {
        expect(() => parseFieldMap("[1,2]")).toThrow(RuntimeError);
        expect(() => parseFieldMap("not json")).toThrow(RuntimeError);
        expect(() => parseFieldMap(null)).toThrow(RuntimeError);
    });

    it("accepts records with or without the fields wrapper", () => {
        expect(parseFieldMapList([{ Name: "A" }, { fields: { Name: "B" } }])).toEqual([{ Name: "A" }, { Name: "B" }]);
    });

    it("is built field by field", () => {
        const fn = new AirtableCreateFieldMapFunction();
        const first = fn.run(undefined, "Name", "Ada");
        const second = fn.run(undefined, "Age", 36, first);

        expect(second).toEqual({ Name: "Ada", Age: 36 });
        expect(first).toEqual({ Name: "Ada" });
    });

    it("reads a JSON list as list and keeps other text as text", () => {
        const fn = new AirtableCreateFieldMapFunction();

        expect(fn.run(undefined, "Tasks", ' ["recA", "recB"] ')).toEqual({ Tasks: ["recA", "recB"] });
        expect(fn.run(undefined, "Progress", "0.5")).toEqual({ Progress: "0.5" });
        expect(fn.run(undefined, "Note", "[draft")).toEqual({ Note: "[draft" });
        expect(fn.run(undefined, "Note", "[not json]")).toEqual({ Note: "[not json]" });
    });
});

describe("formulas", () => {
    it("escapes strings and field names", () => {
        expect(formulaString('say "hi" \\o/')).toEqual('"say \\"hi\\" \\\\o/"');
        expect(formulaField("Weird {name}")).toEqual("{Weird {name\\}}");
    });

    it("compares the cell as text when finding a record", () => {
        expect(findFormula("Email", 'a"b@example.com')).toEqual('{Email} & "" = "a\\"b@example.com"');
    });

    it("formats dates for DATETIME_PARSE in UTC seconds", () => {
        expect(formulaDate(Date.parse("2026-03-04T05:06:07.890Z"))).toEqual(
            'DATETIME_PARSE("2026-03-04 05:06:07", "YYYY-MM-DD HH:mm:ss")'
        );
    });
});

describe("sort", () => {
    it("normalizes direction and accepts plain field names", () => {
        expect(parseSort([{ field: "Name", direction: "DESC" }, "Age"])).toEqual([
            { field: "Name", direction: "desc" },
            { field: "Age", direction: "asc" },
        ]);
        expect(parseSort(undefined)).toBeUndefined();
    });

    it("rejects an unknown direction", () => {
        expect(() => new AirtableCreateSortFunction().run(undefined, "Name", "up")).toThrow(RuntimeError);
    });
});

describe("records", () => {
    it("creates a record and converts values by default", async () => {
        respond(200, record("rec1", { Name: "A" }));

        const result = await new AirtableCreateRecordFunction().run(undefined, "pat", "appX", "My Table", { Name: "A" });

        expect(result).toEqual(record("rec1", { Name: "A" }));
        expect(calls[0].method).toEqual("POST");
        expect(calls[0].url.pathname).toEqual("/v0/appX/My%20Table");
        expect(calls[0].body).toEqual({ fields: { Name: "A" }, typecast: true });
    });

    it("creates many records in batches of 10", async () => {
        const input = Array.from({ length: 23 }, (_, index) => ({ Name: `R${index}` }));
        for (const size of [10, 10, 3]) {
            respond(200, { records: Array.from({ length: size }, (_, index) => record(`rec${index}`)) });
        }

        const result = await new AirtableCreateRecordsFunction().run(undefined, "pat", "appX", "tblY", input, false);

        expect(calls.map((call) => call.body.records.length)).toEqual([10, 10, 3]);
        expect(calls[0].body.typecast).toBe(false);
        expect(result.records).toHaveLength(23);
    });

    it("gives empty fields an empty map", async () => {
        respond(200, { id: "rec1", createdTime: "2026-01-01T00:00:00.000Z" });

        const result = await new AirtableGetRecordFunction().run(undefined, "pat", "appX", "tblY", "rec1");

        expect(result.fields).toEqual({});
        expect(calls[0].url.pathname).toEqual("/v0/appX/tblY/rec1");
    });

    it("merges an update unless asked to replace", async () => {
        respond(200, record("rec1"));
        respond(200, record("rec1"));
        const fn = new AirtableUpdateRecordFunction();

        await fn.run(undefined, "pat", "appX", "tblY", "rec1", { Name: "A" });
        await fn.run(undefined, "pat", "appX", "tblY", "rec1", { Name: "A" }, true);

        expect(calls.map((call) => call.method)).toEqual(["PATCH", "PUT"]);
    });

    it("reports whether a record was deleted", async () => {
        respond(200, { id: "rec1", deleted: true });

        await expect(new AirtableDeleteRecordFunction().run(undefined, "pat", "appX", "tblY", "rec1")).resolves.toBe(true);
        expect(calls[0].method).toEqual("DELETE");
    });

    it("requires the ids", async () => {
        await expect(
            new AirtableGetRecordFunction().run(undefined, "pat", "appX", "tblY", " ")
        ).rejects.toMatchObject({ code: "AIRTABLE_MISSING_PARAMETER" });
    });
});

describe("listing", () => {
    it("reads 100 records by default", async () => {
        respond(200, { records: [record("rec1")] });

        await new AirtableListRecordsFunction().run(undefined, "pat", "appX", "tblY");

        expect(calls[0].url.pathname).toEqual("/v0/appX/tblY/listRecords");
        expect(calls[0].body).toEqual({ pageSize: 100, maxRecords: 100 });
    });

    it("passes the filter, view and sort", async () => {
        respond(200, { records: [] });

        await new AirtableListRecordsFunction().run(
            undefined,
            "pat",
            "appX",
            "tblY",
            '{Status} = "Done"',
            "Grid view",
            [{ field: "Name", direction: "desc" }],
            5
        );

        expect(calls[0].body).toEqual({
            pageSize: 5,
            maxRecords: 5,
            filterByFormula: '{Status} = "Done"',
            view: "Grid view",
            sort: [{ field: "Name", direction: "desc" }],
        });
    });

    it("follows the offset until the limit", async () => {
        respond(200, { records: Array.from({ length: 100 }, (_, i) => record(`a${i}`)), offset: "next" });
        respond(200, { records: Array.from({ length: 50 }, (_, i) => record(`b${i}`)), offset: "more" });

        const records = await listRecords("pat", "appX", "tblY", { maxRecords: 150 });

        expect(records).toHaveLength(150);
        expect(calls).toHaveLength(2);
        expect(calls[1].body).toMatchObject({ offset: "next", pageSize: 50 });
    });

    it("reads every page without a limit", async () => {
        respond(200, { records: [record("a")], offset: "next" });
        respond(200, { records: [record("b")] });

        await expect(listRecords("pat", "appX", "tblY")).resolves.toHaveLength(2);
    });
});

describe("find and upsert", () => {
    it("returns the first match", async () => {
        respond(200, { records: [record("rec1", { Email: "a@b.c" })] });

        const result = await new AirtableFindRecordFunction().run(undefined, "pat", "appX", "tblY", "Email", "a@b.c");

        expect(result.id).toEqual("rec1");
        expect(calls[0].body).toMatchObject({ filterByFormula: '{Email} & "" = "a@b.c"', maxRecords: 1 });
    });

    it("fails when nothing matches", async () => {
        respond(200, { records: [] });

        await expect(
            new AirtableFindRecordFunction().run(undefined, "pat", "appX", "tblY", "Email", "x")
        ).rejects.toMatchObject({ code: "AIRTABLE_RECORD_NOT_FOUND" });
    });

    it("upserts with Airtable's own merge", async () => {
        respond(200, { records: [record("rec1", { Email: "a@b.c", Name: "A" })], createdRecords: [] });

        const result = await new AirtableUpsertRecordFunction().run(undefined, "pat", "appX", "tblY", "Email", {
            Email: "a@b.c",
            Name: "A",
        });

        expect(result.id).toEqual("rec1");
        expect(calls[0].method).toEqual("PATCH");
        expect(calls[0].body).toEqual({
            performUpsert: { fieldsToMergeOn: ["Email"] },
            records: [{ fields: { Email: "a@b.c", Name: "A" } }],
            typecast: true,
        });
    });

    it("needs a value for the key field", async () => {
        await expect(
            new AirtableUpsertRecordFunction().run(undefined, "pat", "appX", "tblY", "Email", { Name: "A" })
        ).rejects.toMatchObject({ code: "AIRTABLE_MISSING_KEY_VALUE" });
        expect(calls).toHaveLength(0);
    });
});

describe("metadata", () => {
    it("lists bases across pages", async () => {
        respond(200, { bases: [{ id: "app1", name: "One", permissionLevel: "create" }], offset: "o" });
        respond(200, { bases: [{ id: "app2", name: "Two", permissionLevel: "read" }] });

        const bases = await new AirtableListBasesFunction().run(undefined, "pat");

        expect(bases.map((base) => base.id)).toEqual(["app1", "app2"]);
        expect(calls[1].url.searchParams.get("offset")).toEqual("o");
    });

    it("maps tables with fields and views", async () => {
        respond(200, {
            tables: [
                {
                    id: "tbl1",
                    name: "Tasks",
                    primaryFieldId: "fld1",
                    fields: [{ id: "fld1", name: "Name", type: "singleLineText" }],
                    views: [{ id: "viw1", name: "Grid", type: "grid" }],
                },
            ],
        });

        const [table] = await new AirtableGetTablesFunction().run(undefined, "pat", "appX");

        expect(calls[0].url.pathname).toEqual("/v0/meta/bases/appX/tables");
        expect(table).toEqual({
            id: "tbl1",
            name: "Tasks",
            description: null,
            primaryFieldId: "fld1",
            fields: [{ id: "fld1", name: "Name", type: "singleLineText", description: null, options: null }],
            views: [{ id: "viw1", name: "Grid", type: "grid" }],
        });
    });
});

describe("attachments", () => {
    it("adds files to the field, one call at a time", () => {
        const fn = new AirtableAddAttachmentFunction();
        const first = fn.run(undefined, "Files", "https://example.com/a.pdf", " a.pdf ");
        const second = fn.run(undefined, "Files", "https://example.com/b.png", undefined, first);

        expect(first).toEqual({ Files: [{ url: "https://example.com/a.pdf", filename: "a.pdf" }] });
        expect(second).toEqual({
            Files: [{ url: "https://example.com/a.pdf", filename: "a.pdf" }, { url: "https://example.com/b.png" }],
        });
    });

    it("keeps the other fields of the map", () => {
        const fields = new AirtableCreateFieldMapFunction().run(undefined, "Status", "Completed");

        expect(new AirtableAddAttachmentFunction().run(undefined, "Files", "https://example.com/a.pdf", "", fields)).toEqual({
            Status: "Completed",
            Files: [{ url: "https://example.com/a.pdf" }],
        });
    });

    it("needs a public url", () => {
        expect(() => new AirtableAddAttachmentFunction().run(undefined, "Files", "file:///etc/passwd")).toThrow(
            RuntimeError
        );
    });
});
