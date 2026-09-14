import { Action, CodeZeroEvent, RuntimeError } from "@code0-tech/hercules";
import type { ActionFlow } from "@code0-tech/tucana/aquila";
import { toAllowedValue } from "@code0-tech/tucana/helpers";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { NotionClient, notionCredentials } from "./client.js";
import { NotionPageSchema, type NotionPage } from "./data_types/notionPage.js";

export const NOTION_EVENT_TYPES = ["NotionDatabaseItemCreated", "NotionDatabaseItemUpdated", "NotionPagePropertyChanged"] as const;
type EventType = typeof NOTION_EVENT_TYPES[number];
interface Snapshot { edited: string; property: unknown }
interface WatchState {
    fingerprint: string;
    activatedAt: string;
    cursor?: string;
    pages: Map<string, Snapshot>;
}

function setting(flow: ActionFlow, name: string): string {
    const encoded = flow.settings.find((entry) => entry.flowSettingId === name)?.value;
    const value = encoded ? toAllowedValue(encoded) : undefined;
    if (typeof value !== "string" || !value.trim()) {
        throw new RuntimeError("NOTION_INVALID_SETTING", `Flow ${flow.flowId} requires ${name}.`);
    }
    return value.trim();
}

/** In-memory checkpoints, isolated per flow and credential set. */
export class NotionPoller {
    private readonly states = new Map<bigint, WatchState>();
    private timer?: ReturnType<typeof setInterval>;
    private running = false;
    private stopped = false;

    constructor(
        private readonly action: Action,
        private readonly intervalMs = 60_000,
        private readonly reportError: (error: unknown) => void = (error) => console.error("Notion polling:", error instanceof Error ? error.message : "Poll failed"),
        private readonly now: () => Date = () => new Date(),
    ) {
        if (!Number.isFinite(intervalMs) || intervalMs < 1000) throw new Error("Notion polling interval must be at least 1000ms.");
    }

    start() {
        if (this.timer) return;
        this.stopped = false;
        this.action.on(CodeZeroEvent.flowDeleted, this.forget);
        this.action.on(CodeZeroEvent.flowUpdated, this.flowUpdated);
        this.action.on(CodeZeroEvent.moduleUpdated, this.configUpdated);
        this.timer = setInterval(() => { void this.tick(); }, this.intervalMs);
        void this.tick();
    }

    stop() {
        this.stopped = true;
        if (this.timer) clearInterval(this.timer);
        this.timer = undefined;
        this.action.off(CodeZeroEvent.flowDeleted, this.forget);
        this.action.off(CodeZeroEvent.flowUpdated, this.flowUpdated);
        this.action.off(CodeZeroEvent.moduleUpdated, this.configUpdated);
        this.states.clear();
    }

    private readonly forget = (flowId: bigint) => { this.states.delete(flowId); };
    private readonly flowUpdated = (flow: ActionFlow) => {
        const state = this.states.get(flow.flowId);
        if (state && !this.isCurrent(flow.flowId, state)) this.states.delete(flow.flowId);
        void this.tick();
    };
    private readonly configUpdated = () => {
        for (const [id, state] of this.states) if (!this.isCurrent(id, state)) this.states.delete(id);
        void this.tick();
    };

    async tick(): Promise<void> {
        if (this.running || this.stopped) return;
        this.running = true;
        try {
            for (const id of this.states.keys()) if (!this.action.flows.has(id)) this.states.delete(id);
            for (const flow of this.action.flows.values()) {
                if (this.stopped) break;
                if (!NOTION_EVENT_TYPES.includes(flow.type as EventType)) continue;
                try { await this.poll(flow); } catch (error) { this.reportError(error); }
            }
        } finally {
            this.running = false;
        }
    }

    private watch(flow: ActionFlow) {
        const config = this.action.configs.get(flow.projectId);
        if (!config) return undefined; // Aquila may deliver flows before project configuration.
        const databaseId = setting(flow, "databaseId");
        const propertyName = flow.type === "NotionPagePropertyChanged" ? setting(flow, "propertyName") : undefined;
        const credentials = notionCredentials(config);
        const fingerprint = createHash("sha256").update(JSON.stringify([
            flow.projectId.toString(), flow.type, databaseId, propertyName, credentials,
        ])).digest("hex");
        return { config, databaseId, propertyName, fingerprint };
    }

    private isCurrent(id: bigint, state: WatchState): boolean {
        if (this.stopped || this.states.get(id) !== state) return false;
        const flow = this.action.flows.get(id);
        try { return !!flow && this.watch(flow)?.fingerprint === state.fingerprint; } catch { return false; }
    }

    private async poll(flow: ActionFlow) {
        const watch = this.watch(flow);
        if (!watch) return;
        const startedAt = this.now().toISOString();
        let state = this.states.get(flow.flowId);
        if (!state || state.fingerprint !== watch.fingerprint) {
            state = { fingerprint: watch.fingerprint, activatedAt: startedAt, pages: new Map() };
            this.states.set(flow.flowId, state);
        }
        const baseline = state.cursor === undefined;
        // Inclusive cursor plus overlap covers equal timestamps and short indexing delays.
        const since = state.cursor ? new Date(Date.parse(state.cursor) - 60_000).toISOString() : undefined;
        const result = await new NotionClient(watch.config).queryDatabase(watch.databaseId,
            since ? { timestamp: "last_edited_time", last_edited_time: { on_or_after: since } } : undefined,
            [{ timestamp: "last_edited_time", direction: "ascending" }]);
        if (!this.isCurrent(flow.flowId, state)) return;
        for (const item of result.results) {
            if (item.object !== "page") continue; // Wiki databases may also return databases.
            // SDK responses can include partial objects without accessible properties.
            const parsed = NotionPageSchema.safeParse(item);
            if (!parsed.success) continue;
            const page = parsed.data;
            const previous = state.pages.get(page.id);
            const snapshot = { edited: page.last_edited_time, property: watch.propertyName ? page.properties[watch.propertyName] ?? null : null };
            let changed = false;
            if (!baseline) {
                if (flow.type === "NotionDatabaseItemCreated") changed = !previous && page.created_time >= state.activatedAt;
                if (flow.type === "NotionDatabaseItemUpdated") changed = previous
                    ? page.last_edited_time > previous.edited
                    : page.last_edited_time >= state.cursor! && page.last_edited_time > page.created_time;
                if (flow.type === "NotionPagePropertyChanged") changed = !!previous && !isDeepStrictEqual(previous.property, snapshot.property);
            }
            if (changed) {
                if (!this.isCurrent(flow.flowId, state)) return;
                // A class-wide fire would incorrectly dispatch to other databases/projects.
                await this.fire(flow.flowId, page);
                if (!this.isCurrent(flow.flowId, state)) return;
            }
            // Advance only after successful delivery. Already acknowledged pages are
            // retained if a later page fails; the cursor itself stays unchanged.
            state.pages.set(page.id, snapshot);
        }
        state.cursor = startedAt;
    }

    private async fire(flowId: bigint, page: NotionPage): Promise<void> {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
            await Promise.race([
                this.action.fire(flowId, page),
                new Promise<never>((_, reject) => {
                    timer = setTimeout(() => reject(new RuntimeError("NOTION_FLOW_TIMEOUT", "Flow acknowledgement timed out; delivery will be retried.")), 60_000);
                }),
            ]);
        } finally {
            if (timer) clearTimeout(timer);
        }
    }
}
