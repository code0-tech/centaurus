import { Action } from "@code0-tech/hercules";
import { NotionPage, NotionPageSchema } from "./data_types/notionPage.js";
import { NotionCredentials, NOTION_DEFAULT_VERSION, notionRequest } from "./helpers.js";
import { NOTION_DATABASE_ITEM_CREATED } from "./events/notionDatabaseItemCreated.js";
import { NOTION_DATABASE_ITEM_UPDATED } from "./events/notionDatabaseItemUpdated.js";
import { NOTION_PAGE_PROPERTY_CHANGED } from "./events/notionPagePropertyChanged.js";

const DEFAULT_POLL_INTERVAL_MS = 60_000;
const QUERY_PAGE_SIZE = 50;

const WATCHED_TYPES = new Set<string>([
    NOTION_DATABASE_ITEM_CREATED,
    NOTION_DATABASE_ITEM_UPDATED,
    NOTION_PAGE_PROPERTY_CHANGED,
]);

interface FlowState {
    initialized: boolean;
    /** Highest created_time / last_edited_time observed so far. */
    lastSeen?: string;
    /** For property-change flows: pageId -> serialized watched property value. */
    propertyValues: Map<string, string>;
}

/**
 * Polls Notion for the action's trigger flows and executes each flow when its
 * watched database/property changes. Notion exposes no push webhooks for these
 * events, so the action polls the query endpoint on a fixed interval and fires
 * flows for the pages that changed since the previous poll.
 */
export class NotionPoller {
    private readonly states = new Map<string, FlowState>();
    private timer?: ReturnType<typeof setTimeout>;
    private stopped = false;

    constructor(
        private readonly action: Action,
        private readonly intervalMs: number = Number(process.env.NOTION_POLL_INTERVAL_MS) ||
            DEFAULT_POLL_INTERVAL_MS
    ) {}

    start(): void {
        this.stopped = false;
        const tick = async () => {
            if (this.stopped) {
                return;
            }
            try {
                await this.pollOnce();
            } catch (error) {
                console.error("Notion poll failed:", error instanceof Error ? error.message : error);
            }
            if (!this.stopped) {
                this.timer = setTimeout(tick, this.intervalMs);
            }
        };
        this.timer = setTimeout(tick, this.intervalMs);
    }

    stop(): void {
        this.stopped = true;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }

    private async pollOnce(): Promise<void> {
        const flows = this.action.flows.values().filter((flow) => WATCHED_TYPES.has(flow.type));
        for (const flow of flows) {
            try {
                await this.pollFlow(flow);
            } catch (error) {
                console.error(
                    `Notion poll for flow ${flow.flowId} failed:`,
                    error instanceof Error ? error.message : error
                );
            }
        }
    }

    private async pollFlow(flow: { flowId: bigint; projectId: bigint; type: string; settings: unknown[] }): Promise<void> {
        const databaseId = settingString(flow.settings, "databaseId");
        if (!databaseId) {
            console.warn(`Notion flow ${flow.flowId} is missing its databaseId setting; skipping.`);
            return;
        }
        const credentials = this.resolveCredentials(flow.projectId);
        if (!credentials) {
            console.warn(`Notion flow ${flow.flowId} has no configured integration_token; skipping.`);
            return;
        }

        const timestamp = flow.type === NOTION_DATABASE_ITEM_CREATED ? "created_time" : "last_edited_time";
        const response = await notionRequest<{ results?: unknown[] }>(
            credentials,
            "POST",
            `/databases/${databaseId}/query`,
            { sorts: [{ timestamp, direction: "descending" }], page_size: QUERY_PAGE_SIZE }
        );
        const pages = (response.results ?? [])
            .map((result) => NotionPageSchema.safeParse(result))
            .filter((parsed): parsed is { success: true; data: NotionPage } => parsed.success)
            .map((parsed) => parsed.data);

        const stateKey = flow.flowId.toString();
        let state = this.states.get(stateKey);
        if (!state) {
            state = { initialized: false, propertyValues: new Map() };
            this.states.set(stateKey, state);
        }

        if (flow.type === NOTION_PAGE_PROPERTY_CHANGED) {
            await this.handlePropertyChange(flow, state, pages);
            return;
        }

        const timeOf = (page: NotionPage) =>
            flow.type === NOTION_DATABASE_ITEM_CREATED ? page.created_time : page.last_edited_time;

        const maxTime = pages.reduce<string | undefined>((max, page) => {
            const time = timeOf(page);
            return time && (!max || time > max) ? time : max;
        }, undefined);

        if (!state.initialized) {
            state.initialized = true;
            state.lastSeen = maxTime;
            return;
        }

        const baseline = state.lastSeen;
        const changed = pages.filter((page) => {
            const time = timeOf(page);
            return time !== undefined && (baseline === undefined || time > baseline);
        });
        // Fire oldest first so flows observe changes in chronological order.
        for (const page of changed.reverse()) {
            await this.fireFlow(flow.flowId, page);
        }
        if (maxTime && (!baseline || maxTime > baseline)) {
            state.lastSeen = maxTime;
        }
    }

    private async handlePropertyChange(
        flow: { flowId: bigint; settings: unknown[] },
        state: FlowState,
        pages: NotionPage[]
    ): Promise<void> {
        const propertyName = settingString(flow.settings, "propertyName");
        if (!propertyName) {
            console.warn(`Notion flow ${flow.flowId} is missing its propertyName setting; skipping.`);
            return;
        }

        const current = new Map<string, string>();
        for (const page of pages) {
            current.set(page.id, JSON.stringify(page.properties?.[propertyName] ?? null));
        }

        if (!state.initialized) {
            state.initialized = true;
            state.propertyValues = current;
            return;
        }

        for (const page of pages) {
            const value = current.get(page.id)!;
            const previous = state.propertyValues.get(page.id);
            if (previous !== undefined && previous !== value) {
                await this.fireFlow(flow.flowId, page);
            }
        }
        state.propertyValues = current;
    }

    private resolveCredentials(projectId: bigint): NotionCredentials | undefined {
        const config = this.action.configs.get(projectId);
        const token = config?.findConfig("integration_token") as string | undefined;
        if (!token) {
            return undefined;
        }
        const version = (config?.findConfig("notion_version") as string | undefined) || NOTION_DEFAULT_VERSION;
        return { token, version };
    }

    private async fireFlow(flowId: bigint, page: NotionPage): Promise<void> {
        try {
            await this.action.executeFlow(flowId, page as unknown as Record<string, unknown>);
        } catch (error) {
            console.error(
                `Failed to execute Notion flow ${flowId}:`,
                error instanceof Error ? error.message : error
            );
        }
    }
}

/** Reads a string-valued flow setting by its identifier. */
function settingString(settings: unknown[], id: string): string | undefined {
    for (const setting of settings as Array<{
        flowSettingId?: string;
        value?: { kind?: { oneofKind?: string; stringValue?: string } };
    }>) {
        if (setting.flowSettingId === id && setting.value?.kind?.oneofKind === "stringValue") {
            return setting.value.kind.stringValue;
        }
    }
    return undefined;
}
