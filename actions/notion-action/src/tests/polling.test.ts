import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";
import { ActionFlow } from "@code0-tech/tucana/aquila";
import { constructValue } from "@code0-tech/tucana/helpers";
import { NotionPoller } from "../polling.js";
import { config, list, page } from "./fixtures.js";
import { mockNotionHttp } from "./httpMock.js";

const http = vi.hoisted(() => ({ request: vi.fn() }));

function flow(type = "NotionDatabaseItemCreated", flowId = 1n, projectId = 1n, databaseId = "db-1", propertyName = "Done") {
    return ActionFlow.create({
        flowId, projectId, type,
        settings: [
            { flowSettingId: "databaseId", value: constructValue(databaseId) },
            ...(type === "NotionPagePropertyChanged" ? [{ flowSettingId: "propertyName", value: constructValue(propertyName) }] : []),
        ],
    });
}

function setup(type?: string) {
    const action = new Action("notion-test", "1.0.0", "localhost:50051", "code0-tech", "simple:notion", "", []);
    action.configs.set(1n, config());
    action.flows.set(1n, flow(type));
    const fire = vi.spyOn(action, "fire").mockResolvedValue(null);
    const errors = vi.fn();
    let now = new Date("2026-09-14T10:00:00.000Z");
    const poller = new NotionPoller(action, 60_000, errors, () => now);
    return { action, fire, errors, poller, setTime: (time: string) => { now = new Date(time); } };
}

beforeEach(() => { vi.clearAllMocks(); http.request.mockReset(); mockNotionHttp(http.request); });
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
        expect(fire).toHaveBeenCalledExactlyOnceWith(1n, added);
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
        expect(fire).toHaveBeenCalledExactlyOnceWith(1n, edited);
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
        expect(fire).toHaveBeenCalledExactlyOnceWith(1n, edited);
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
        expect(fire).toHaveBeenCalledExactlyOnceWith(1n, edited);
    });

    it("isolates flows and projects with the same page IDs", async () => {
        const { action, poller, fire } = setup("NotionDatabaseItemUpdated");
        action.configs.set(2n, config({ integration_token: "project-2" }, 2n));
        action.flows.set(2n, flow("NotionDatabaseItemUpdated", 2n, 2n, "db-2"));
        http.request.mockResolvedValue({ data: list([page()]) });
        await poller.tick();
        const edited = page("page-1", { last_edited_time: "2026-09-14T10:00:30.000Z" });
        http.request.mockResolvedValueOnce({ data: list([edited]) }).mockResolvedValueOnce({ data: list([page()]) });
        await poller.tick();
        expect(fire).toHaveBeenCalledExactlyOnceWith(1n, edited);
        expect(http.request.mock.calls.map((call) => call[0].url)).toEqual(["/databases/db-1/query", "/databases/db-2/query", "/databases/db-1/query", "/databases/db-2/query"]);
    });

    it("waits for configuration and ignores unrelated events", async () => {
        const { action, poller } = setup();
        action.configs.clear();
        await poller.tick();
        expect(http.request).not.toHaveBeenCalled();
        action.configs.set(1n, config());
        action.flows.set(1n, flow("Unrelated"));
        await poller.tick();
        expect(http.request).not.toHaveBeenCalled();
    });

    it("rebaselines when credentials or watched settings change", async () => {
        const { action, poller, fire } = setup("NotionDatabaseItemUpdated");
        http.request.mockResolvedValueOnce({ data: list([page()]) });
        await poller.tick();
        action.configs.set(1n, config({ integration_token: "rotated" }));
        http.request.mockResolvedValue({ data: list([page("page-1", { last_edited_time: "2026-09-14T10:00:30.000Z" })]) });
        await poller.tick();
        expect(fire).not.toHaveBeenCalled();
        expect(http.request.mock.lastCall?.[0].data.filter).toBeUndefined();
        action.flows.set(1n, flow("NotionDatabaseItemUpdated", 1n, 1n, "new-db"));
        await poller.tick();
        expect(fire).not.toHaveBeenCalled();
        expect(http.request.mock.lastCall?.[0].url).toBe("/databases/new-db/query");
    });

    it("rejects overlapping polls and discards results for a deleted flow", async () => {
        const { action, poller, fire } = setup();
        let resolve!: (value: unknown) => void;
        http.request.mockReturnValue(new Promise((done) => { resolve = done; }));
        const first = poller.tick();
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
        const { action, poller } = setup();
        http.request.mockResolvedValue({ data: list([]) });
        poller.start();
        poller.start();
        await vi.advanceTimersByTimeAsync(60_000);
        expect(http.request).toHaveBeenCalledTimes(2);
        expect(action.listenerCount(CodeZeroEvent.flowDeleted)).toBe(1);
        poller.stop();
        await vi.advanceTimersByTimeAsync(120_000);
        await poller.tick();
        expect(http.request).toHaveBeenCalledTimes(2);
        expect(action.listenerCount(CodeZeroEvent.flowDeleted)).toBe(0);
    });
});
