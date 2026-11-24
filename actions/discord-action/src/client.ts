import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import { RuntimeError } from "@code0-tech/hercules";

/**
 * Every flow brings its own bot token, so the action talks to as many bots as
 * there are tokens in use. One gateway connection is kept per token: logging in
 * is expensive and rate limited, and the event bridge needs a live connection
 * anyway.
 *
 * Tokens that back an event flow are pinned (see {@link setPinnedTokens}) and
 * stay connected. A token that only a runtime function used is dropped again
 * once it has been idle for {@link IDLE_TTL_MS}.
 */
interface ClientEntry {
    ready: Promise<Client>;
    lastUsed: number;
}

const IDLE_TTL_MS = 30 * 60 * 1000;
const READY_TIMEOUT_MS = 30 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

const entries = new Map<string, ClientEntry>();
const pinnedTokens = new Set<string>();
let sweeper: NodeJS.Timeout | undefined;

/**
 * The intents the action's events need. Message content and guild members are
 * privileged: they have to be enabled for the bot in the Discord developer
 * portal, otherwise the login is rejected.
 */
const INTENTS = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
];

/**
 * Log in (or reuse the login) for a bot token and resolve once the client is
 * ready. A failed login is not cached, so the next call tries again.
 */
export async function getDiscordClient(token: string): Promise<Client> {
    const trimmed = token?.trim();
    if (!trimmed) {
        throw new RuntimeError("DISCORD_MISSING_BOT_TOKEN", "No Discord bot token was given.");
    }

    const existing = entries.get(trimmed);
    if (existing) {
        existing.lastUsed = Date.now();
        return existing.ready;
    }

    const entry: ClientEntry = {
        lastUsed: Date.now(),
        ready: login(trimmed).catch((error: unknown) => {
            // Keep a failed login out of the cache so the next call retries.
            entries.delete(trimmed);
            throw error;
        }),
    };

    entries.set(trimmed, entry);
    startSweeper();
    return entry.ready;
}

async function login(token: string): Promise<Client> {
    const client = new Client({
        intents: INTENTS,
        partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User],
    });

    client.on("error", (error) => {
        console.error("Discord client error:", error.message);
    });

    // `login` resolves as soon as the token was accepted, but the application
    // and its commands are only populated once the client is ready - so wait for
    // that instead of handing out a half-initialized client.
    const ready = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
            () => reject(new Error(`The Discord client was not ready within ${READY_TIMEOUT_MS / 1000}s.`)),
            READY_TIMEOUT_MS
        );
        timeout.unref?.();
        client.once(Events.ClientReady, () => {
            clearTimeout(timeout);
            resolve();
        });
    });

    try {
        await client.login(token);
        await ready;
        console.log(`Discord bot logged in as ${client.user?.tag}`);
        return client;
    } catch (error: any) {
        await client.destroy().catch(() => undefined);
        throw new RuntimeError(
            "DISCORD_LOGIN_FAILED",
            `Could not log in with the given bot token: ${error?.message ?? String(error)}`
        );
    }
}

/**
 * Declare the tokens that back an event flow. Their clients stay connected and
 * clients for tokens that are no longer pinned become evictable again.
 */
export function setPinnedTokens(tokens: Iterable<string>): void {
    pinnedTokens.clear();
    for (const token of tokens) {
        const trimmed = token?.trim();
        if (trimmed) pinnedTokens.add(trimmed);
    }
}

export function isPinnedToken(token: string): boolean {
    return pinnedTokens.has(token.trim());
}

/** Drop every client. Only used by tests and on shutdown. */
export async function destroyDiscordClients(): Promise<void> {
    const current = Array.from(entries.values());
    entries.clear();
    pinnedTokens.clear();
    if (sweeper) {
        clearInterval(sweeper);
        sweeper = undefined;
    }
    await Promise.all(
        current.map(async (entry) => {
            try {
                const client = await entry.ready;
                await client.destroy();
            } catch {
                // A client that never became ready has nothing to tear down.
            }
        })
    );
}

function startSweeper(): void {
    if (sweeper) return;
    sweeper = setInterval(sweepIdleClients, SWEEP_INTERVAL_MS);
    sweeper.unref?.();
}

function sweepIdleClients(): void {
    const now = Date.now();
    for (const [token, entry] of entries) {
        if (pinnedTokens.has(token)) continue;
        if (now - entry.lastUsed < IDLE_TTL_MS) continue;

        entries.delete(token);
        entry.ready
            .then((client) => client.destroy())
            .catch(() => undefined);
    }
}
