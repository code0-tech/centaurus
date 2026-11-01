import { Action, CodeZeroEvent } from "@code0-tech/hercules";
import { toAllowedValue } from "@code0-tech/tucana/helpers";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { AddressObject } from "mailparser";

const RECONNECT_DELAY_MS = 5000;

interface MailConnection {
    stop: () => Promise<void>;
}

interface ProjectImapConfig {
    host: string;
    port: string;
    secure: string;
    username: string;
    password: string;
    mailbox: string;
}

interface ReceivedMailPayload {
    messageId: string;
    from: string;
    to: string[];
    cc: string[];
    subject: string;
    text: string;
    html: string;
    date: string;
}

/** Live IMAP connections, keyed by project id (as a string). */
const connections = new Map<string, MailConnection>();

let reconciling = false;
let reconcileQueued = false;

/**
 * Returns true when `recipients` should trigger a flow configured with
 * `configured` addresses. An empty `configured` list matches everything.
 * Matching is an exact, case-insensitive comparison of email addresses.
 */
export function matchesAddresses(recipients: string[], configured: string[]): boolean {
    if (configured.length === 0) return true;
    const normalizedRecipients = new Set(recipients.map((address) => address.trim().toLowerCase()));
    return configured.some((address) => normalizedRecipients.has(address.trim().toLowerCase()));
}

let started = false;

/**
 * Starts the reconciling IMAP connection manager: one IMAP connection per
 * project that has at least one flow bound to the MAIL_RECEIVED trigger.
 * Connections are opened/closed as flows are created/updated/deleted.
 *
 * Safe to call more than once (e.g. once per `connected` event after a
 * reconnect) — only the first call wires up the listeners.
 */
export function startMailListener(action: Action): void {
    if (started) return;
    started = true;

    scheduleReconcile(action);

    action.on(CodeZeroEvent.flowUpdated, () => scheduleReconcile(action));
    action.on(CodeZeroEvent.flowDeleted, () => scheduleReconcile(action));
    action.on(CodeZeroEvent.moduleUpdated, () => scheduleReconcile(action));
}

/**
 * Queues a reconcile pass, folding concurrent requests into a single
 * follow-up run so overlapping flow/module update events can't race.
 */
function scheduleReconcile(action: Action): void {
    if (reconciling) {
        reconcileQueued = true;
        return;
    }

    reconciling = true;
    reconcileConnections(action)
        .catch((error: unknown) => {
            console.error("Failed to reconcile IMAP listeners:", error);
        })
        .finally(() => {
            reconciling = false;
            if (reconcileQueued) {
                reconcileQueued = false;
                scheduleReconcile(action);
            }
        });
}

/**
 * Computes the set of projects that currently need an IMAP connection (i.e.
 * have a MAIL_RECEIVED flow), opens connections for the ones missing one, and
 * closes connections for projects that no longer need one.
 */
async function reconcileConnections(action: Action): Promise<void> {
    const activeProjectIds = new Set<string>();
    for (const flow of action.flows.values()) {
        if (flow.type === "MAIL_RECEIVED") {
            activeProjectIds.add(flow.projectId.toString());
        }
    }

    for (const [projectIdKey, connection] of connections) {
        if (activeProjectIds.has(projectIdKey)) continue;
        connections.delete(projectIdKey);
        try {
            await connection.stop();
        } catch (error) {
            console.error(`Failed to stop the IMAP connection for project ${projectIdKey}:`, error);
        }
    }

    for (const projectIdKey of activeProjectIds) {
        if (connections.has(projectIdKey)) continue;

        const projectId = BigInt(projectIdKey);
        const config = action.configs.get(projectId);
        if (!config) {
            console.warn(`Project ${projectIdKey} has MAIL_RECEIVED flow(s) but no configuration yet; skipping for now.`);
            continue;
        }

        const host = config.findConfig("imap_host") as string | undefined;
        if (!host) {
            console.warn(`Project ${projectIdKey} has MAIL_RECEIVED flow(s) but no imap_host configured; skipping.`);
            continue;
        }

        const imapConfig: ProjectImapConfig = {
            host,
            port: (config.findConfig("imap_port") as string | undefined) ?? "993",
            secure: (config.findConfig("imap_secure") as string | undefined) ?? "true",
            username: (config.findConfig("imap_username") as string | undefined) ?? "",
            password: (config.findConfig("imap_password") as string | undefined) ?? "",
            mailbox: (config.findConfig("imap_mailbox") as string | undefined) ?? "INBOX",
        };

        // Reserve the slot immediately so a second reconcile pass triggered
        // while this connection is still being established doesn't try to
        // open a duplicate one.
        connections.set(projectIdKey, { stop: async () => {} });

        connectProject(action, projectId, imapConfig)
            .then((connection) => {
                connections.set(projectIdKey, connection);
            })
            .catch((error: unknown) => {
                connections.delete(projectIdKey);
                console.error(`Failed to open the IMAP connection for project ${projectIdKey}:`, error);
                setTimeout(() => scheduleReconcile(action), RECONNECT_DELAY_MS);
            });
    }
}

/**
 * Opens an IMAP connection for a single project, holds a lock on its
 * configured mailbox so the client idles and reports new mail, and wires up
 * reconnect-on-error/close behaviour mirroring the action's own Aquila
 * connection handling.
 */
async function connectProject(action: Action, projectId: bigint, config: ProjectImapConfig): Promise<MailConnection> {
    const client = new ImapFlow({
        host: config.host,
        port: Number(config.port) || 993,
        secure: String(config.secure).toLowerCase() === "true",
        auth: { user: config.username, pass: config.password },
        logger: false,
    });

    let stopped = false;
    let highWatermark = 0;

    const scheduleReconnect = (): void => {
        if (stopped) return;
        stopped = true;
        connections.delete(projectId.toString());
        client.close();
        console.log(`Reconnecting IMAP for project ${projectId} in ${RECONNECT_DELAY_MS}ms...`);
        setTimeout(() => scheduleReconcile(action), RECONNECT_DELAY_MS);
    };

    client.on("error", (error: Error) => {
        console.error(`IMAP connection error for project ${projectId}:`, error.message);
        scheduleReconnect();
    });

    client.on("close", () => {
        if (!stopped) {
            console.log(`IMAP connection for project ${projectId} closed unexpectedly.`);
            scheduleReconnect();
        }
    });

    // Serialize processing so overlapping `exists` events can't both run against
    // the same stale high-watermark and dispatch a message twice.
    let processing: Promise<void> = Promise.resolve();
    client.on("exists", () => {
        processing = processing
            .then(() => processNewMessages(action, projectId, client, highWatermark))
            .then((newHighWatermark) => {
                highWatermark = newHighWatermark;
            })
            .catch((error: unknown) => {
                console.error(`Failed to process new mail for project ${projectId}:`, error);
            });
    });

    await client.connect();
    // Open the mailbox without holding a lock: a held lock keeps the connection
    // "busy", which suppresses ImapFlow's automatic IDLE and the `exists` events
    // we rely on to detect new mail.
    const mailbox = await client.mailboxOpen(config.mailbox);
    highWatermark = mailbox.uidNext - 1;

    console.log(`Watching IMAP mailbox "${config.mailbox}" for project ${projectId} (project config: ${config.host}).`);

    const stop = async (): Promise<void> => {
        stopped = true;
        try {
            await client.logout();
        } catch {
            client.close();
        }
    };

    return { stop };
}

/**
 * Fetches every message with a UID above `highWatermark`, dispatches each to
 * the matching MAIL_RECEIVED flows, and returns the new high-watermark.
 */
async function processNewMessages(action: Action, projectId: bigint, client: ImapFlow, highWatermark: number): Promise<number> {
    let newHighWatermark = highWatermark;

    for await (const message of client.fetch(`${highWatermark + 1}:*`, { uid: true, source: true }, { uid: true })) {
        if (message.uid <= highWatermark) continue;
        newHighWatermark = Math.max(newHighWatermark, message.uid);

        try {
            await dispatchMessage(action, projectId, message.source);
        } catch (error) {
            console.error(`Failed to dispatch received mail (UID ${message.uid}) for project ${projectId}:`, error);
        }
    }

    return newHighWatermark;
}

/**
 * Parses a raw message and executes every MAIL_RECEIVED flow of the given
 * project whose configured addresses match one of the message's recipients.
 */
async function dispatchMessage(action: Action, projectId: bigint, source: Buffer | undefined): Promise<void> {
    if (!source) return;

    const parsed = await simpleParser(source);

    const to = extractAddresses(parsed.to);
    const cc = extractAddresses(parsed.cc);
    const recipients = [...to, ...cc];

    const payload: ReceivedMailPayload = {
        messageId: parsed.messageId ?? "",
        from: parsed.from?.value?.[0]?.address ?? parsed.from?.text ?? "",
        to,
        cc,
        subject: parsed.subject ?? "",
        text: parsed.text ?? "",
        html: typeof parsed.html === "string" ? parsed.html : "",
        date: parsed.date ? parsed.date.toISOString() : "",
    };

    for (const flow of action.flows.values()) {
        if (flow.type !== "MAIL_RECEIVED") continue;
        if (flow.projectId !== projectId) continue;

        const addressesSetting = flow.settings.find((setting) => setting.flowSettingId === "addresses");
        const configuredAddresses = toStringArray(addressesSetting?.value ? toAllowedValue(addressesSetting.value) : undefined);

        if (!matchesAddresses(recipients, configuredAddresses)) continue;

        try {
            await action.executeFlow(flow.flowId, payload);
        } catch (error) {
            console.error(`Failed to execute flow ${flow.flowId} for received mail:`, error);
        }
    }
}

/** Flattens a mailparser address header field down to a list of addresses. */
function extractAddresses(field: AddressObject | AddressObject[] | undefined): string[] {
    if (!field) return [];
    const objects = Array.isArray(field) ? field : [field];
    return objects.flatMap((object) =>
        (object.value ?? [])
            .map((entry) => entry.address)
            .filter((address): address is string => Boolean(address))
    );
}

/** Coerces a PlainValue (from a flow's `addresses` setting) into a string array. */
function toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter((entry): entry is string => typeof entry === "string");
    }
    if (typeof value === "string" && value.length > 0) {
        return [value];
    }
    return [];
}
