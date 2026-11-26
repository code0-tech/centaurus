import { Action, CodeZeroEvent, RuntimeError } from "@code0-tech/hercules"
import type { ActionFlow } from "@code0-tech/tucana/aquila"
import { toAllowedValue } from "@code0-tech/tucana/helpers"
import { createHash } from "node:crypto"
import { isDeepStrictEqual } from "node:util"
import { NotionClient, notionCredentials } from "./client.js"
import { NotionPageSchema, type NotionPage } from "./data_types/notionPage.js"

export const NOTION_EVENT_TYPES = ["NotionDatabaseItemCreated", "NotionDatabaseItemUpdated", "NotionPagePropertyChanged"] as const
type EventType = (typeof NOTION_EVENT_TYPES)[number]
// Page timestamps are DATE values (Unix microseconds); the cursor stays an
// ISO 8601 string because it is sent back to Notion as a filter value.
interface Snapshot {
    edited: number
    property: unknown
}
interface WatchState {
    fingerprint: string
    activatedAt: number
    cursor?: string
    dataSourceId?: string
    pages: Map<string, Snapshot>
}

export const DEFAULT_POLL_INTERVAL_MS = 60_000
export const MIN_POLL_INTERVAL_MS = 10_000
// After a new baseline, poll again soon so a first test change shows up quickly.
const FOLLOW_UP_DELAY_MS = 10_000
const MINUTE_MS = 60_000
// Timers drift by a few milliseconds; a flow counts as due slightly early.
const SCHEDULE_TOLERANCE_MS = 1_000
export const POLL_INTERVAL_SETTING = "pollIntervalSeconds"

/** Reads the action-wide default NOTION_POLL_INTERVAL_MS; invalid or too small values fall back to a safe interval. */
export function pollIntervalFromEnv(value = process.env.NOTION_POLL_INTERVAL_MS, warn: (message: string) => void = console.warn): number {
    if (value === undefined || value.trim() === "") return DEFAULT_POLL_INTERVAL_MS
    const interval = Number(value)
    if (!Number.isInteger(interval) || interval <= 0) {
        warn(`Notion polling: ignoring invalid NOTION_POLL_INTERVAL_MS "${value}"; using ${DEFAULT_POLL_INTERVAL_MS}ms.`)
        return DEFAULT_POLL_INTERVAL_MS
    }
    if (interval < MIN_POLL_INTERVAL_MS) {
        warn(`Notion polling: NOTION_POLL_INTERVAL_MS ${interval}ms is below the minimum; using ${MIN_POLL_INTERVAL_MS}ms.`)
        return MIN_POLL_INTERVAL_MS
    }
    return interval
}

function rawSetting(flow: ActionFlow, name: string): unknown {
    const encoded = flow.settings.find((entry) => entry.flowSettingId === name)?.value
    return encoded ? toAllowedValue(encoded) : undefined
}

function setting(flow: ActionFlow, name: string): string {
    const value = rawSetting(flow, name)
    if (typeof value !== "string" || !value.trim()) {
        throw new RuntimeError("NOTION_INVALID_SETTING", `Flow ${flow.flowId} requires ${name}.`)
    }
    return value.trim()
}

/** In-memory checkpoints, isolated per flow and integration token. */
export class NotionPoller {
    private readonly states = new Map<bigint, WatchState>()
    // When each flow was last polled and whether its follow-up poll is pending.
    private readonly schedule = new Map<bigint, { at: number; followUp: boolean }>()
    private timer?: ReturnType<typeof setInterval>
    private running = false
    private stopped = false
    // Status messages already logged, so each one appears once per flow and state.
    private readonly announced = new Set<string>()

    constructor(
        private readonly action: Action,
        /** Default interval for flows without a pollIntervalSeconds setting. */
        private readonly intervalMs = DEFAULT_POLL_INTERVAL_MS,
        private readonly reportError: (error: unknown) => void = (error) =>
            console.error("Notion polling:", error instanceof Error ? error.message : "Poll failed"),
        private readonly now: () => Date = () => new Date(),
        private readonly log: (message: string) => void = (message) => console.log("Notion polling:", message)
    ) {
        if (!Number.isFinite(intervalMs) || intervalMs < 1000) throw new Error("Notion polling interval must be at least 1000ms.")
    }

    start() {
        if (this.timer) return
        this.stopped = false
        this.action.on(CodeZeroEvent.flowDeleted, this.forget)
        this.action.on(CodeZeroEvent.flowUpdated, this.flowUpdated)
        // A short base timer; each flow is only polled once its own interval is due.
        this.timer = setInterval(this.pollDue, Math.min(MIN_POLL_INTERVAL_MS, this.intervalMs))
        this.pollDue()
    }

    stop() {
        this.stopped = true
        if (this.timer) clearInterval(this.timer)
        this.timer = undefined
        this.action.off(CodeZeroEvent.flowDeleted, this.forget)
        this.action.off(CodeZeroEvent.flowUpdated, this.flowUpdated)
        this.states.clear()
        this.schedule.clear()
        this.announced.clear()
    }

    private info(key: string, message: string) {
        if (this.announced.has(key)) return
        this.announced.add(key)
        this.log(message)
    }

    private readonly pollDue = () => {
        void this.tick(false)
    }
    private readonly forget = (flowId: bigint) => {
        this.states.delete(flowId)
        this.schedule.delete(flowId)
    }
    private reset(flowId: bigint) {
        // A changed watch gets a new baseline right away instead of waiting for its interval.
        this.states.delete(flowId)
        this.schedule.delete(flowId)
    }
    private readonly flowUpdated = (flow: ActionFlow) => {
        const state = this.states.get(flow.flowId)
        if (state && !this.isCurrent(flow.flowId, state)) this.reset(flow.flowId)
        this.pollDue()
    }

    /** The flow's pollIntervalSeconds setting, falling back to the action-wide default. */
    private interval(flow: ActionFlow): number {
        const raw = rawSetting(flow, POLL_INTERVAL_SETTING)
        if (raw === undefined || raw === null || raw === "") return this.intervalMs
        const seconds = Number(raw)
        if (!Number.isFinite(seconds) || seconds <= 0) {
            this.info(`interval:${flow.flowId}:${String(raw)}`,
                `Flow ${flow.flowId}: ignoring invalid ${POLL_INTERVAL_SETTING} "${String(raw)}"; using ${this.intervalMs / 1000}s.`)
            return this.intervalMs
        }
        if (seconds * 1000 < MIN_POLL_INTERVAL_MS) {
            this.info(`interval:${flow.flowId}:${seconds}`,
                `Flow ${flow.flowId}: ${POLL_INTERVAL_SETTING} ${seconds}s is below the minimum; using ${MIN_POLL_INTERVAL_MS / 1000}s.`)
            return MIN_POLL_INTERVAL_MS
        }
        return seconds * 1000
    }

    private isDue(flow: ActionFlow, now: number): boolean {
        const entry = this.schedule.get(flow.flowId)
        if (!entry) return true
        const elapsed = now - entry.at + SCHEDULE_TOLERANCE_MS
        return (entry.followUp && elapsed >= FOLLOW_UP_DELAY_MS) || elapsed >= this.interval(flow)
    }

    /**
     * Polls the watched flows. The base timer only polls flows whose interval is
     * due (force = false); a forced tick polls every flow immediately.
     */
    async tick(force = true): Promise<void> {
        if (this.running || this.stopped) return
        this.running = true
        try {
            for (const id of this.states.keys()) if (!this.action.flows.has(id)) this.states.delete(id)
            for (const id of this.schedule.keys()) if (!this.action.flows.has(id)) this.schedule.delete(id)
            for (const flow of this.action.flows.values()) {
                if (this.stopped) break
                if (!NOTION_EVENT_TYPES.includes(flow.type as EventType)) {
                    this.info(`ignored:${flow.flowId}:${flow.type}`, `Ignoring flow ${flow.flowId} of type ${flow.type}; expected one of ${NOTION_EVENT_TYPES.join(", ")}.`)
                    continue
                }
                const now = this.now().getTime()
                if (!force && !this.isDue(flow, now)) continue
                // Failed polls also wait for the next interval instead of retrying every tick.
                const entry = { at: now, followUp: false }
                this.schedule.set(flow.flowId, entry)
                try {
                    entry.followUp = await this.poll(flow)
                } catch (error) {
                    this.reportError(error)
                }
            }
        } finally {
            this.running = false
        }
    }

    private watch(flow: ActionFlow) {
        const { token } = notionCredentials(rawSetting(flow, "integrationToken"))
        const databaseId = setting(flow, "databaseId")
        const propertyName = flow.type === "NotionPagePropertyChanged" ? setting(flow, "propertyName") : undefined
        const fingerprint = createHash("sha256")
            .update(JSON.stringify([flow.projectId.toString(), flow.type, databaseId, propertyName, token]))
            .digest("hex")
        return { token, databaseId, propertyName, fingerprint }
    }

    private isCurrent(id: bigint, state: WatchState): boolean {
        if (this.stopped || this.states.get(id) !== state) return false
        const flow = this.action.flows.get(id)
        try {
            return !!flow && this.watch(flow).fingerprint === state.fingerprint
        } catch {
            return false
        }
    }

    /** Polls one flow; returns true when this poll established a new baseline. */
    private async poll(flow: ActionFlow): Promise<boolean> {
        const watch = this.watch(flow)
        const now = this.now()
        const startedAt = now.toISOString()
        let state = this.states.get(flow.flowId)
        if (!state || state.fingerprint !== watch.fingerprint) {
            // Notion rounds created_time down to the minute, so a page created in the
            // activation minute would otherwise look older than the watch.
            const activatedAt = Math.floor(now.getTime() / MINUTE_MS) * MINUTE_MS * 1000
            state = { fingerprint: watch.fingerprint, activatedAt, pages: new Map() }
            this.states.set(flow.flowId, state)
        }
        const baseline = state.cursor === undefined
        // Inclusive cursor plus overlap covers equal timestamps and short indexing delays.
        const since = state.cursor ? new Date(Date.parse(state.cursor) - 60_000).toISOString() : undefined
        const client = new NotionClient(watch.token)
        const dataSourceId = state.dataSourceId ?? (await client.resolveDataSourceId(watch.databaseId))
        if (!this.isCurrent(flow.flowId, state)) return false
        state.dataSourceId = dataSourceId
        const result = await client.queryDataSource(
            dataSourceId,
            since ? { timestamp: "last_edited_time", last_edited_time: { on_or_after: since } } : undefined,
            [{ timestamp: "last_edited_time", direction: "ascending" }]
        )
        if (!this.isCurrent(flow.flowId, state)) return false
        const columns = new Set<string>()
        for (const item of result.results) {
            if (item.object !== "page") continue // Wiki data sources may also return data sources.
            // SDK responses can include partial objects without accessible properties.
            const parsed = NotionPageSchema.safeParse(item)
            if (!parsed.success) continue
            const page = parsed.data
            for (const name of Object.keys(page.properties)) columns.add(name)
            const previous = state.pages.get(page.id)
            const snapshot = { edited: page.last_edited_time, property: watch.propertyName ? (page.properties[watch.propertyName] ?? null) : null }
            let changed = false
            if (!baseline) {
                if (flow.type === "NotionDatabaseItemCreated") changed = !previous && page.created_time >= state.activatedAt
                if (flow.type === "NotionDatabaseItemUpdated")
                    changed = previous
                        ? page.last_edited_time > previous.edited
                        : page.last_edited_time >= Date.parse(state.cursor!) * 1000 && page.last_edited_time > page.created_time
                if (flow.type === "NotionPagePropertyChanged") changed = !!previous && !isDeepStrictEqual(previous.property, snapshot.property)
            }
            if (changed) {
                if (!this.isCurrent(flow.flowId, state)) return false
                // A class-wide fire would incorrectly dispatch to other databases/projects.
                await this.fire(flow.flowId, page)
                this.log(`Triggered flow ${flow.flowId} (${flow.type}) for page ${page.id}.`)
                if (!this.isCurrent(flow.flowId, state)) return false
            }
            // Advance only after successful delivery. Already acknowledged pages are
            // retained if a later page fails; the cursor itself stays unchanged.
            state.pages.set(page.id, snapshot)
        }
        state.cursor = startedAt
        if (baseline && watch.propertyName && columns.size > 0 && !columns.has(watch.propertyName)) {
            // Property names are case-sensitive; a typo would otherwise never fire.
            this.info(`missing:${flow.flowId}:${watch.fingerprint}`,
                `Flow ${flow.flowId}: database ${watch.databaseId} has no property "${watch.propertyName}". Available: ${[...columns].join(", ")}.`)
        }
        if (baseline) {
            const property = watch.propertyName ? `, property "${watch.propertyName}"` : ""
            this.info(`baseline:${flow.flowId}:${watch.fingerprint}`,
                `Flow ${flow.flowId} (${flow.type}) watches database ${watch.databaseId}${property}; baseline of ${state.pages.size} page(s), changes from now on trigger it.`)
        }
        return baseline
    }

    private async fire(flowId: bigint, page: NotionPage): Promise<void> {
        let timer: ReturnType<typeof setTimeout> | undefined
        try {
            await Promise.race([
                this.action.fire(flowId, page),
                new Promise<never>((_, reject) => {
                    timer = setTimeout(
                        () => reject(new RuntimeError("NOTION_FLOW_TIMEOUT", "Flow acknowledgement timed out; delivery will be retried.")),
                        60_000
                    )
                }),
            ])
        } finally {
            if (timer) clearTimeout(timer)
        }
    }
}
