import { Action, CodeZeroEvent, PlainValue } from "@code0-tech/hercules";
import { ChatInputCommandInteraction, Client, Events } from "discord.js";
import { getDiscordClient, setPinnedTokens } from "./client.js";
import { DesiredSlashCommand, normalizeCommandName, syncSlashCommands } from "./slashCommands.js";
import {
    mapDiscordGuildMember,
    mapDiscordMessage,
    mapDiscordReaction,
    mapDiscordUser,
    toEventPayload,
} from "./helpers.js";

/**
 * Bridges Discord gateway events to the flows that listen for them.
 *
 * Every event flow names the bot token it listens with as its first setting, so
 * the bridge keeps one gateway connection per token in use and, whenever Discord
 * reports something, fires the flows of that bot whose remaining settings match.
 *
 * A slash command flow additionally needs its command to exist in Discord -
 * {@link syncSlashCommands} registers it from the same flow list.
 */
type ActionFlow = ReturnType<Action["flows"]["values"]>[number];

const EVENT_IDENTIFIERS = new Set([
    "DiscordMessageCreated",
    "DiscordReactionAdded",
    "DiscordMemberJoined",
    "DiscordMemberLeft",
    "DiscordSlashCommandInvoked",
]);

/** Aquila reports flows one message at a time, so a burst is coalesced. */
const SYNC_DEBOUNCE_MS = 250;

const bridgedClients = new WeakSet<Client>();
let syncTimer: NodeJS.Timeout | undefined;

export function startEventBridge(action: Action): void {
    const scheduleSync = () => {
        if (syncTimer) clearTimeout(syncTimer);
        syncTimer = setTimeout(() => {
            syncTimer = undefined;
            void syncEventFlows(action);
        }, SYNC_DEBOUNCE_MS);
        syncTimer.unref?.();
    };

    action.on(CodeZeroEvent.connected, scheduleSync);
    action.on(CodeZeroEvent.flowUpdated, scheduleSync);
    action.on(CodeZeroEvent.flowDeleted, scheduleSync);
}

async function syncEventFlows(action: Action): Promise<void> {
    const tokens = new Set<string>();
    const commands: DesiredSlashCommand[] = [];

    for (const flow of action.flows.values()) {
        if (!EVENT_IDENTIFIERS.has(flow.type)) continue;

        const token = readSetting(flow, "botToken");
        if (!token) {
            console.warn(`Flow ${flow.flowId} listens for ${flow.type} without a bot token - skipping it.`);
            continue;
        }
        tokens.add(token);

        if (flow.type === "DiscordSlashCommandInvoked") {
            const command = desiredCommand(flow, token);
            if (command) commands.push(command);
        }
    }

    setPinnedTokens(tokens);

    for (const token of tokens) {
        try {
            bridgeClient(await getDiscordClient(token), token, action);
        } catch (error: any) {
            console.error(`Could not listen for Discord events: ${error?.message ?? String(error)}`);
        }
    }

    await syncSlashCommands(commands);
}

function desiredCommand(flow: ActionFlow, token: string): DesiredSlashCommand | undefined {
    const name = normalizeCommandName(readSetting(flow, "commandName"));
    if (!name) {
        console.warn(
            `Flow ${flow.flowId} has no usable command name - a Discord command name is at most 32 characters long and has no spaces.`
        );
        return undefined;
    }

    const description = readSetting(flow, "description");
    if (!description) {
        console.warn(`Flow ${flow.flowId} has no description for /${name} - Discord requires one.`);
        return undefined;
    }

    return { token, name, description, guildId: readSetting(flow, "guildId") };
}

function bridgeClient(client: Client, token: string, action: Action): void {
    if (bridgedClients.has(client)) return;
    bridgedClients.add(client);

    client.on(Events.MessageCreate, async (message) => {
        if (message.author?.bot) return;

        const flows = eventFlows(action, "DiscordMessageCreated", token).filter((flow) =>
            settingMatches(flow, "channelId", message.channelId)
        );
        if (flows.length === 0) return;

        await fireFlows(action, flows, toEventPayload(mapDiscordMessage(message)));
    });

    client.on(Events.MessageReactionAdd, async (reaction, user) => {
        try {
            if (user.bot) return;

            const fullReaction = reaction.partial ? await reaction.fetch() : reaction;
            const fullUser = user.partial ? await user.fetch() : user;
            const emoji = fullReaction.emoji.name ?? fullReaction.emoji.id ?? "";

            const flows = eventFlows(action, "DiscordReactionAdded", token).filter(
                (flow) =>
                    settingMatches(flow, "channelId", fullReaction.message.channelId) &&
                    settingMatches(flow, "emoji", emoji)
            );
            if (flows.length === 0) return;

            await fireFlows(action, flows, toEventPayload(mapDiscordReaction(fullReaction, fullUser)));
        } catch (error: any) {
            console.error(`Failed to handle a Discord reaction: ${error?.message ?? String(error)}`);
        }
    });

    client.on(Events.GuildMemberAdd, async (member) => {
        const flows = eventFlows(action, "DiscordMemberJoined", token).filter((flow) =>
            settingMatches(flow, "guildId", member.guild.id)
        );
        if (flows.length === 0) return;

        await fireFlows(action, flows, toEventPayload(mapDiscordGuildMember(member)));
    });

    client.on(Events.GuildMemberRemove, async (member) => {
        const flows = eventFlows(action, "DiscordMemberLeft", token).filter((flow) =>
            settingMatches(flow, "guildId", member.guild.id)
        );
        if (flows.length === 0) return;

        const fullMember = member.partial ? await member.fetch().catch(() => member) : member;
        await fireFlows(action, flows, toEventPayload(mapDiscordGuildMember(fullMember)));
    });

    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const flows = eventFlows(action, "DiscordSlashCommandInvoked", token).filter(
            (flow) =>
                normalizeCommandName(readSetting(flow, "commandName")) === interaction.commandName &&
                settingMatches(flow, "guildId", interaction.guildId ?? "")
        );
        if (flows.length === 0) return;

        await runSlashCommand(action, flows, interaction);
    });
}

/**
 * Discord expects a reaction to a command within three seconds, which no flow
 * can promise - so the reply is deferred ("<bot> is thinking...") and the
 * interaction token travels with the payload. The flow replaces the placeholder
 * with `discordAnswerSlashCommand`, any time within Discord's 15 minute window.
 */
async function runSlashCommand(
    action: Action,
    flows: ActionFlow[],
    interaction: ChatInputCommandInteraction
): Promise<void> {
    try {
        await interaction.deferReply();
    } catch (error: any) {
        console.error(`Could not acknowledge /${interaction.commandName}: ${error?.message ?? String(error)}`);
        return;
    }

    await fireFlows(
        action,
        flows,
        toEventPayload({
            id: interaction.id,
            commandName: interaction.commandName,
            interactionToken: interaction.token,
            options: interaction.options.data.map((option) => ({
                name: option.name,
                value: option.value ?? "",
            })),
            user: mapDiscordUser(interaction.user),
            channelId: interaction.channelId,
            guildId: interaction.guildId,
        })
    );
}

function eventFlows(action: Action, identifier: string, token: string): ActionFlow[] {
    return action.flows.filter((flow) => flow.type === identifier && readSetting(flow, "botToken") === token);
}

/** A setting the flow left empty is a wildcard, not a filter for `""`. */
function settingMatches(flow: ActionFlow, identifier: string, value: string): boolean {
    const setting = readSetting(flow, identifier);
    return !setting || setting === value;
}

function readSetting(flow: ActionFlow, identifier: string): string | undefined {
    const setting = flow.settings.find((candidate) => candidate.flowSettingId === identifier);
    if (setting?.value?.kind.oneofKind !== "stringValue") return undefined;

    const value = setting.value.kind.stringValue.trim();
    return value.length > 0 ? value : undefined;
}

async function fireFlows(action: Action, flows: ActionFlow[], payload: PlainValue): Promise<PlainValue[]> {
    const results = await Promise.allSettled(flows.map((flow) => action.fire(flow.flowId, payload)));

    return results.flatMap((result, index) => {
        if (result.status === "fulfilled") return [result.value];

        const reason: any = result.reason;
        console.error(`Flow ${flows[index].flowId} failed: ${reason?.message ?? String(reason)}`);
        return [];
    });
}
