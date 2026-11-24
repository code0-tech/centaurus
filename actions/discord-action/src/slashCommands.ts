import { ApplicationCommandManager, GuildApplicationCommandManager } from "discord.js";
import { getDiscordClient } from "./client.js";

/**
 * Keeps the slash commands of the bots in sync with the flows that listen for
 * them. Aquila streams every flow of the action, so the flows are the source of
 * truth: a command is created for a flow that appears and deleted again once its
 * flow is gone.
 *
 * Only commands this action knows about are touched. A command the bot owner
 * created elsewhere is left alone.
 */
export interface DesiredSlashCommand {
    token: string;
    name: string;
    description: string;
    guildId?: string;
}

interface ManagedCommand {
    commandId: string;
    token: string;
    name: string;
    description: string;
    guildId?: string;
}

/** Discord's rules for a chat input command name. */
const COMMAND_NAME_PATTERN = /^[-_\p{L}\p{N}]{1,32}$/u;
const DESCRIPTION_MAX_LENGTH = 100;

const managedCommands = new Map<string, ManagedCommand>();
/** Scopes whose existing commands were already read, so adoption runs once. */
const adoptedScopes = new Set<string>();

/**
 * Normalize what a flow calls its command: Discord reports the name without a
 * leading slash and in lower case, so `/Ping` and `ping` have to end up as the
 * same command. An invalid name yields undefined instead of a command nobody
 * can call.
 */
export function normalizeCommandName(name: string | undefined): string | undefined {
    if (!name) return undefined;

    const normalized = name.trim().replace(/^\/+/, "").toLowerCase();
    return COMMAND_NAME_PATTERN.test(normalized) ? normalized : undefined;
}

export async function syncSlashCommands(desired: DesiredSlashCommand[]): Promise<void> {
    const wanted = new Map<string, DesiredSlashCommand>();
    for (const command of desired) {
        wanted.set(commandKey(command.token, command.guildId, command.name), command);
    }

    for (const scope of scopesOf(wanted.values())) {
        await adoptScope(scope.token, scope.guildId, scope.names);
    }

    for (const command of wanted.values()) {
        try {
            await createOrUpdate(command);
        } catch (error: any) {
            console.error(`Could not register the slash command /${command.name}: ${error?.message ?? String(error)}`);
        }
    }

    for (const [key, command] of Array.from(managedCommands)) {
        if (wanted.has(key)) continue;

        try {
            const manager = await commandManager(command.token, command.guildId);
            await manager.delete(command.commandId);
            managedCommands.delete(key);
            console.log(`Removed the slash command /${command.name}, its flow is gone`);
        } catch (error: any) {
            // A command Discord no longer knows is gone either way.
            managedCommands.delete(key);
            console.error(`Could not remove the slash command /${command.name}: ${error?.message ?? String(error)}`);
        }
    }
}

async function createOrUpdate(command: DesiredSlashCommand): Promise<void> {
    const key = commandKey(command.token, command.guildId, command.name);
    const known = managedCommands.get(key);
    const description = command.description.slice(0, DESCRIPTION_MAX_LENGTH);

    if (known && known.description === description) return;

    const manager = await commandManager(command.token, command.guildId);

    if (known) {
        await manager.edit(known.commandId, { description });
        managedCommands.set(key, { ...known, description });
        console.log(`Updated the slash command /${command.name}`);
        return;
    }

    const created = await manager.create({ name: command.name, description });
    managedCommands.set(key, {
        commandId: created.id,
        token: command.token,
        name: command.name,
        description,
        guildId: command.guildId,
    });
    console.log(`Registered the slash command /${command.name}${command.guildId ? ` in ${command.guildId}` : ""}`);
}

/**
 * Read the commands a bot already has, once per bot and scope, and take over the
 * ones a flow asks for - a restarted action would otherwise rewrite the commands
 * it created in an earlier run.
 *
 * Only commands a flow names are adopted. A command the bot has for other
 * reasons never enters the registry, and so is never deleted by the sync.
 */
async function adoptScope(token: string, guildId: string | undefined, names: Set<string>): Promise<void> {
    const scope = commandKey(token, guildId, "");
    if (adoptedScopes.has(scope)) return;
    adoptedScopes.add(scope);

    try {
        const manager = await commandManager(token, guildId);

        for (const command of (await manager.fetch({})).values()) {
            if (!names.has(command.name)) continue;

            const key = commandKey(token, guildId, command.name);
            if (managedCommands.has(key)) continue;

            managedCommands.set(key, {
                commandId: command.id,
                token,
                name: command.name,
                description: command.description,
                guildId,
            });
        }
    } catch (error: any) {
        // Without the existing commands the sync still works - it just rewrites
        // what it wants - so this must not fail the sync.
        adoptedScopes.delete(scope);
        console.error(`Could not read the existing slash commands: ${error?.message ?? String(error)}`);
    }
}

async function commandManager(
    token: string,
    guildId?: string
): Promise<ApplicationCommandManager | GuildApplicationCommandManager> {
    const client = await getDiscordClient(token);

    if (guildId) {
        return (await client.guilds.fetch(guildId)).commands;
    }

    if (!client.application) {
        throw new Error("The Discord client has no application to register commands on.");
    }

    return client.application.commands;
}

interface CommandScope {
    token: string;
    guildId?: string;
    names: Set<string>;
}

/** The bots and servers the wanted commands live in, with their command names. */
function scopesOf(commands: Iterable<DesiredSlashCommand>): CommandScope[] {
    const scopes = new Map<string, CommandScope>();

    for (const command of commands) {
        const key = commandKey(command.token, command.guildId, "");
        const scope = scopes.get(key) ?? { token: command.token, guildId: command.guildId, names: new Set<string>() };
        scope.names.add(command.name);
        scopes.set(key, scope);
    }

    return Array.from(scopes.values());
}

function commandKey(token: string, guildId: string | undefined, name: string): string {
    return [token, guildId ?? "global", name].join("::");
}

/** Only used by tests, to start from an empty registry. */
export function resetSlashCommandState(): void {
    managedCommands.clear();
    adoptedScopes.clear();
}
