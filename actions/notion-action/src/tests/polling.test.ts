import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";
import { ActionFlow } from "@code0-tech/tucana/aquila";
import { constructValue } from "@code0-tech/tucana/helpers";
import { NotionPoller, pollIntervalFromEnv } from "../polling.js";
import { list, page, parsed, TOKEN } from "./fixtures.js";
import { mockNotionHttp } from "./httpMock.js";

const http = vi.hoisted(() => ({ request: vi.fn() }));

interface Watch { token?: string | null; interval?: number | string }

function flow(type = "NotionDatabaseItemCreated", flowId = 1n, projectId = 1n, databaseId = "db-1", propertyName = "Done", watch: Watch = {}) {
    const token = watch.token === undefined ? TOKEN : watch.token;
    return ActionFlow.create({
        flowId, projectId, type,
        settings: [
            ...(token === null ? [] : [{ flowSettingId: "integrationToken", value: constructValue(token) }]),
            { flowSettingId: "databaseId", value: constructValue(databaseId) },
            ...(type === "NotionPagePropertyChanged" ? [{ flowSettingId: "propertyName", value: constructValue(propertyName) }] : []),
            ...(watch.interval === undefined ? [] : [{ flowSettingId: "pollIntervalSeconds", value: constructValue(watch.interval) }]),
        ],
    });
}

function setup(type?: string, options: { realClock?: boolean; watch?: Watch } = {}) {
    const action = new Action("notion-test", "1.0.0", "localhost:50051", "code0-tech", "simple:notion", "", []);
    action.flows.set(1n, flow(type, 1n, 1n, "db-1", "Done", options.watch));
    const fire = vi.spyOn(action, "fire").mockResolvedValue(null);
    const errors = vi.fn();
    const log = vi.fn();
    let now = new Date("2026-09-14T10:00:00.000Z");
    // Timer tests need a running clock (faked by vi.useFakeTimers) for the per-flow schedule.
    const poller = new NotionPoller(action, 60_000, errors, options.realClock ? () => new Date() : () => now, log);
    return { action, fire, errors, log, poller, setTime: (time: string) => { now = new Date(time); } };
}

let fetchMock: ReturnType<typeof mockNotionHttp>;
beforeEach(() => { vi.clearAllMocks(); http.request.mockReset(); fetchMock = mockNotionHttp(http.request); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("Notion polling", () => {
    it("baselines all pages, then fires only newly created pages once", async () => {
        const { poller, fire, setTime } = setup();
        http.request.mockResolvedValueOnce({ data: list([page()], "next") }).mockResolvedValueOnce({ data: list([page("old-2")]) });
        await poller.tick();
        expect(fire).not.toHaveBeenCalled();
        expect(http.request).toHaveBeenCalledTimes(2);
        const added = page("new", { created_time: "2026-09-14T10:00:30.000Z", last_edited_time: "2026-09-14T10:00:30.000Z" });
        setTime("2026-09-14T10:01:00.000Z");
        http.request.mockResolvedValue({ data: list([page(), added]) });
        await poller.tick();
        await poller.tick();
        expect(fire).toHaveBeenCalledExactlyOnceWith(1n, parsed(added));
        expect(http.request.mock.calls[2][0].data.filter).toEqual({ timestamp: "last_edited_time", last_edited_time: { on_or_after: "2026-09-14T09:59:00.000Z" } });
    });

    it("fires updates but not repeated timestamps or initial history", async () => {
        const { poller, fire } = setup("NotionDatabaseItemUpdated");
        http.request.mockResolvedValueOnce({ data: list([page()]) });
        await poller.tick();
        const edited = page("page-1", { last_edited_time: "2026-09-14T10:00:30.000Z" });
        http.request.mockResolvedValue({ data: list([edited]) });
        await poller.tick();
        await poller.tick();
        expect(fire).toHaveBeenCalledExactlyOnceWith(1n, parsed(edited));
    });

    it("detects property changes including clearing but ignores other edits and object key order", async () => {
        const { poller, fire } = setup("NotionPagePropertyChanged");
        http.request.mockResolvedValueOnce({ data: list([page()]) });
        await poller.tick();
        const reordered = page("page-1", { last_edited_time: "2026-09-14T10:01:00.000Z", properties: { Done: { checkbox: false, type: "checkbox", id: "done" }, Other: { number: 1 } } });
        http.request.mockResolvedValueOnce({ data: list([reordered]) });
        await poller.tick();
        expect(fire).not.toHaveBeenCalled();
        const edited = page("page-1", { last_edited_time: "2026-09-14T10:01:00.000Z", properties: { Done: { id: "done", type: "checkbox", checkbox: true } } });
        http.request.mockResolvedValue({ data: list([edited]) });
        await poller.tick();
        await poller.tick();
        expect(fire).toHaveBeenCalledExactlyOnceWith(1n, parsed(edited));
        const cleared = page("page-1", { properties: {} });
        http.request.mockResolvedValueOnce({ data: list([cleared]) });
        await poller.tick();
        expect(fire).toHaveBeenCalledTimes(2);
    });

    it("uses first observation of a new page as its property baseline", async () => {
        const { poller, fire } = setup("NotionPagePropertyChanged");
        http.request.mockResolvedValueOnce({ data: list([]) }).mockResolvedValueOnce({ data: list([page()]) });
        await poller.tick();
        await poller.tick();
        expect(fire).not.toHaveBeenCalled();
    });

    it("delivers two pages with identical timestamps and deduplicates overlapping polls", async () => {
        const { poller, fire } = setup("NotionDatabaseItemUpdated");
        http.request.mockResolvedValueOnce({ data: list([page("a"), page("b")]) });
        await poller.tick();
        const changed = ["a", "b"].map((id) => page(id, { last_edited_time: "2026-09-14T10:00:30.000Z" }));
        http.request.mockResolvedValue({ data: list(changed) });
        await poller.tick();
        await poller.tick();
        expect(fire).toHaveBeenCalledTimes(2);
    });

    it("retries failed delivery without refiring pages already acknowledged", async () => {
        const { poller, fire, errors } = setup("NotionDatabaseItemUpdated");
        http.request.mockResolvedValueOnce({ data: list([page("a"), page("b")]) });
        await poller.tick();
        const changed = ["a", "b"].map((id) => page(id, { last_edited_time: "2026-09-14T10:00:30.000Z" }));
        http.request.mockResolvedValue({ data: list(changed) });
        fire.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error("Flow failed"));
        await poller.tick();
        expect(errors).toHaveBeenCalledTimes(1);
        await poller.tick();
        expect(fire.mock.calls.map((call) => (call[1] as { id: string }).id)).toEqual(["a", "b", "b"]);
    });

    it("does not advance state or deliver a partial batch if pagination fails", async () => {
        const { poller, fire, errors } = setup("NotionDatabaseItemUpdated");
        http.request.mockResolvedValueOnce({ data: list([page()]) });
        await poller.tick();
        const edited = page("page-1", { last_edited_time: "2026-09-14T10:00:30.000Z" });
        http.request.mockResolvedValueOnce({ data: list([edited], "next") }).mockRejectedValueOnce(new Error("Network failure"));
        await poller.tick();
        expect(fire).not.toHaveBeenCalled();
        expect(errors).toHaveBeenCalledTimes(1);
        http.request.mockResolvedValueOnce({ data: list([edited]) });
        await poller.tick();
        expect(fire).toHaveBeenCalledExactlyOnceWith(1n, parsed(edited));
    });

    it("isolates flows and projects with the same page IDs", async () => {
        const { action, poller, fire } = setup("NotionDatabaseItemUpdated");
        action.flows.set(2n, flow("NotionDatabaseItemUpdated", 2n, 2n, "db-2", "Done", { token: "project-2" }));
        http.request.mockResolvedValue({ data: list([page()]) });
        await poller.tick();
        const edited = page("page-1", { last_edited_time: "2026-09-14T10:00:30.000Z" });
        http.request.mockResolvedValueOnce({ data: list([edited]) }).mockResolvedValueOnce({ data: list([page()]) });
        await poller.tick();
        expect(fire).toHaveBeenCalledExactlyOnceWith(1n, parsed(edited));
        expect(http.request.mock.calls.map((call) => call[0].url)).toEqual(["/data_sources/db-1-ds/query", "/data_sources/db-2-ds/query", "/data_sources/db-1-ds/query", "/data_sources/db-2-ds/query"]);
    });

    it("resolves the database's data source once per watch", async () => {
        const { action, poller } = setup("NotionDatabaseItemUpdated");
        http.request.mockResolvedValue({ data: list([page()]) });
        await poller.tick();
        await poller.tick();
        expect(fetchMock.databaseLookups).toHaveBeenCalledExactlyOnceWith("db-1");
        action.flows.set(1n, flow("NotionDatabaseItemUpdated", 1n, 1n, "new-db"));
        await poller.tick();
        expect(fetchMock.databaseLookups).toHaveBeenLastCalledWith("new-db");
        expect(fetchMock.databaseLookups).toHaveBeenCalledTimes(2);
    });

    it("logs the watch state once per flow instead of skipping silently", async () => {
        const { action, poller, log, errors } = setup("NotionPagePropertyChanged");
        action.flows.set(2n, flow("SomethingElse", 2n));
        action.flows.set(3n, flow("NotionDatabaseItemCreated", 3n, 1n, "db-1", "Done", { token: null }));
        http.request.mockResolvedValue({ data: list([page()]) });
        await poller.tick();
        await poller.tick();
        const messages = log.mock.calls.map(([message]) => message);
        expect(messages.filter((message) => message.includes("Ignoring flow 2 of type SomethingElse"))).toHaveLength(1);
        expect(errors).toHaveBeenCalledWith(expect.objectContaining({ code: "NOTION_MISSING_TOKEN" }));
        expect(messages.filter((message) => message.includes("Flow 1 (NotionPagePropertyChanged) watches database db-1, property \"Done\"; baseline of 1 page(s)"))).toHaveLength(1);
    });

    it("reports a watched property the database does not have", async () => {
        const { action, poller, log } = setup("NotionPagePropertyChanged");
        action.flows.set(1n, flow("NotionPagePropertyChanged", 1n, 1n, "db-1", "done"));
        http.request.mockResolvedValue({ data: list([page()]) });
        await poller.tick();
        expect(log.mock.calls.map(([message]) => message)).toContainEqual(expect.stringMatching(/has no property "done"\. Available: .*Done/));
    });

    it("skips flows without an integration token and ignores unrelated events", async () => {
        const { action, poller, errors } = setup(undefined, { watch: { token: null } });
        await poller.tick();
        expect(http.request).not.toHaveBeenCalled();
        expect(errors).toHaveBeenCalledWith(expect.objectContaining({ code: "NOTION_MISSING_TOKEN" }));
        action.flows.set(1n, flow("Unrelated"));
        await poller.tick();
        expect(http.request).not.toHaveBeenCalled();
    });

    it("rebaselines when credentials or watched settings change", async () => {
        const { action, poller, fire } = setup("NotionDatabaseItemUpdated");
        http.request.mockResolvedValueOnce({ data: list([page()]) });
        await poller.tick();
        action.flows.set(1n, flow("NotionDatabaseItemUpdated", 1n, 1n, "db-1", "Done", { token: "rotated" }));
        http.request.mockResolvedValue({ data: list([page("page-1", { last_edited_time: "2026-09-14T10:00:30.000Z" })]) });
        await poller.tick();
        expect(fire).not.toHaveBeenCalled();
        expect(http.request.mock.lastCall?.[0].data.filter).toBeUndefined();
        action.flows.set(1n, flow("NotionDatabaseItemUpdated", 1n, 1n, "new-db"));
        await poller.tick();
        expect(fire).not.toHaveBeenCalled();
        expect(http.request.mock.lastCall?.[0].url).toBe("/data_sources/new-db-ds/query");
    });

    it("rejects overlapping polls and discards results for a deleted flow", async () => {
        const { action, poller, fire } = setup();
        let resolve!: (value: unknown) => void;
        http.request.mockReturnValue(new Promise((done) => { resolve = done; }));
        const first = poller.tick();
        // The data source lookup precedes the query; wait until it is in flight.
        await vi.waitFor(() => expect(http.request).toHaveBeenCalledTimes(1));
        await poller.tick();
        expect(http.request).toHaveBeenCalledTimes(1);
        action.flows.delete(1n);
        resolve({ data: list([page()]) });
        await first;
        expect(fire).not.toHaveBeenCalled();
    });

    it("does not stall all subsequent polls on a missing flow acknowledgement", async () => {
        vi.useFakeTimers();
        const { poller, fire, errors } = setup("NotionDatabaseItemUpdated");
        http.request.mockResolvedValueOnce({ data: list([page()]) });
        await poller.tick();
        http.request.mockResolvedValue({ data: list([page("page-1", { last_edited_time: "2026-09-14T10:00:30.000Z" })]) });
        fire.mockImplementationOnce(() => new Promise(() => {}));
        const tick = poller.tick();
        await vi.advanceTimersByTimeAsync(60_000);
        await tick;
        expect(errors).toHaveBeenCalledWith(expect.objectContaining({ code: "NOTION_FLOW_TIMEOUT" }));
        await poller.tick();
        expect(fire).toHaveBeenCalledTimes(2);
    });

    it("starts one timer and removes listeners and stops requests on shutdown", async () => {
        vi.useFakeTimers();
        const { action, poller } = setup(undefined, { realClock: true });
        http.request.mockResolvedValue({ data: list([]) });
        poller.start();
        poller.start();
        // Baseline, then the follow-up after 10s; the regular 60s interval is not due yet.
        await vi.advanceTimersByTimeAsync(60_000);
        expect(http.request).toHaveBeenCalledTimes(2);
        expect(action.listenerCount(CodeZeroEvent.flowDeleted)).toBe(1);
        poller.stop();
        await vi.advanceTimersByTimeAsync(120_000);
        await poller.tick();
        expect(http.request).toHaveBeenCalledTimes(2);
        expect(action.listenerCount(CodeZeroEvent.flowDeleted)).toBe(0);
    });

    it("polls again 10 seconds after a new baseline, then only on the interval", async () => {
        vi.useFakeTimers();
        const { poller } = setup(undefined, { realClock: true });
        http.request.mockResolvedValue({ data: list([]) });
        poller.start();
        await vi.advanceTimersByTimeAsync(0);
        expect(http.request).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(10_000);
        expect(http.request).toHaveBeenCalledTimes(2);
        // No further follow-up once the baseline exists; the next poll is 60s after the follow-up.
        await vi.advanceTimersByTimeAsync(50_000);
        expect(http.request).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(10_000);
        expect(http.request).toHaveBeenCalledTimes(3);
        poller.stop();
    });

    it("uses each flow's own pollIntervalSeconds", async () => {
        vi.useFakeTimers();
        const { action, poller } = setup(undefined, { realClock: true, watch: { interval: 20 } });
        action.flows.set(2n, flow("NotionDatabaseItemCreated", 2n, 2n, "db-1", "Done", { token: "other-token" }));
        http.request.mockResolvedValue({ data: list([]) });
        poller.start();
        await vi.advanceTimersByTimeAsync(10_000); // baselines and follow-ups of both flows
        const afterFollowUps = http.request.mock.calls.length;
        expect(afterFollowUps).toBe(4);
        await vi.advanceTimersByTimeAsync(20_000); // flow 1 is due every 20s, flow 2 every 60s
        expect(http.request.mock.calls.length - afterFollowUps).toBe(1);
        await vi.advanceTimersByTimeAsync(40_000);
        // 70s: flow 1 polled at 30s, 50s and 70s; flow 2 once at 70s.
        expect(http.request.mock.calls.length - afterFollowUps).toBe(4);
        poller.stop();
    });

    it("falls back for invalid or too small intervals and keeps the baseline on changes", async () => {
        vi.useFakeTimers();
        const { action, poller, log } = setup(undefined, { realClock: true, watch: { interval: 3 } });
        http.request.mockResolvedValue({ data: list([]) });
        poller.start();
        await vi.advanceTimersByTimeAsync(30_000);
        expect(log.mock.calls.map(([message]) => message)).toContainEqual(expect.stringContaining("pollIntervalSeconds 3s is below the minimum; using 10s"));
        // Changing only the interval must not start a new baseline.
        const updated = flow(undefined, 1n, 1n, "db-1", "Done", { interval: "soon" });
        action.flows.set(1n, updated);
        action.emit(CodeZeroEvent.flowUpdated, updated);
        await vi.advanceTimersByTimeAsync(60_000);
        const messages = log.mock.calls.map(([message]) => message);
        expect(messages).toContainEqual(expect.stringContaining('ignoring invalid pollIntervalSeconds "soon"; using 60s'));
        expect(messages.filter((message) => message.includes("baseline of"))).toHaveLength(1);
        poller.stop();
    });

    it("fires for a page created in the activation minute despite Notion's minute rounding", async () => {
        const { poller, fire, setTime } = setup();
        setTime("2026-09-14T10:00:20.000Z");
        http.request.mockResolvedValueOnce({ data: list([]) });
        await poller.tick();
        // Created at 10:00:40, which Notion reports as 10:00:00.
        const added = page("new", { created_time: "2026-09-14T10:00:00.000Z", last_edited_time: "2026-09-14T10:00:00.000Z" });
        setTime("2026-09-14T10:01:00.000Z");
        http.request.mockResolvedValue({ data: list([added]) });
        await poller.tick();
        expect(fire).toHaveBeenCalledExactlyOnceWith(1n, parsed(added));
    });

    it("reads the poll interval from the environment with a 10 second minimum", () => {
        const warn = vi.fn();
        expect(pollIntervalFromEnv(undefined, warn)).toBe(60_000);
        expect(pollIntervalFromEnv("", warn)).toBe(60_000);
        expect(pollIntervalFromEnv("15000", warn)).toBe(15_000);
        expect(warn).not.toHaveBeenCalled();
        expect(pollIntervalFromEnv("2000", warn)).toBe(10_000);
        expect(pollIntervalFromEnv("soon", warn)).toBe(60_000);
        expect(pollIntervalFromEnv("-5", warn)).toBe(60_000);
        expect(warn).toHaveBeenCalledTimes(3);
    });
});
