import "reflect-metadata";
import { beforeEach, describe, expect, it, vi } from "vitest";

const clients = new Map<string, any>();

vi.mock("../src/client.js", () => ({
    getDiscordClient: async (token: string) => {
        const client = clients.get(token);
        if (!client) throw new Error(`No fake client for ${token}`);
        return client;
    },
    setPinnedTokens: () => undefined,
}));

const { normalizeCommandName, resetSlashCommandState, syncSlashCommands } = await import("../src/slashCommands.js");

/** A command manager that records what the sync did to it. */
function fakeManager(existing: { id: string; name: string; description: string }[] = []) {
    const commands = new Map(existing.map((command) => [command.id, { ...command }]));
    let nextId = 100;

    return {
        commands,
        created: [] as { name: string; description: string }[],
        edited: [] as { id: string; description: string }[],
        deleted: [] as string[],
        fetched: 0,
        async fetch() {
            this.fetched += 1;
            return new Map(Array.from(commands, ([id, command]) => [id, { ...command }]));
        },
        async create(command: { name: string; description: string }) {
            this.created.push(command);
            const id = String(nextId++);
            commands.set(id, { id, ...command });
            return { id, ...command };
        },
        async edit(id: string, data: { description: string }) {
            this.edited.push({ id, description: data.description });
            const command = commands.get(id)!;
            command.description = data.description;
            return command;
        },
        async delete(id: string) {
            this.deleted.push(id);
            commands.delete(id);
            return null;
        },
    };
}

function fakeClient(application: ReturnType<typeof fakeManager>, guilds: Record<string, ReturnType<typeof fakeManager>> = {}) {
    return {
        application: { commands: application },
        guilds: {
            fetch: async (guildId: string) => {
                const commands = guilds[guildId];
                if (!commands) throw new Error(`Unknown guild ${guildId}`);
                return { id: guildId, commands };
            },
        },
    };
}

describe("normalizeCommandName", () => {
    it("accepts what discord accepts, lowercased and without the slash", () => {
        expect(normalizeCommandName("/Ping")).toEqual("ping");
        expect(normalizeCommandName("  deploy-status ")).toEqual("deploy-status");
        expect(normalizeCommandName("stückzahl_2")).toEqual("stückzahl_2");
    });

    it("rejects a name discord would refuse", () => {
        expect(normalizeCommandName("two words")).toBeUndefined();
        expect(normalizeCommandName("a".repeat(33))).toBeUndefined();
        expect(normalizeCommandName("")).toBeUndefined();
        expect(normalizeCommandName(undefined)).toBeUndefined();
    });
});

describe("syncSlashCommands", () => {
    let application: ReturnType<typeof fakeManager>;

    beforeEach(() => {
        resetSlashCommandState();
        clients.clear();
        application = fakeManager();
        clients.set("token-a", fakeClient(application));
    });

    it("registers a command for a flow and leaves it alone on the next sync", async () => {
        const desired = [{ token: "token-a", name: "ping", description: "Answers with pong" }];

        await syncSlashCommands(desired);
        await syncSlashCommands(desired);

        expect(application.created).toEqual([{ name: "ping", description: "Answers with pong" }]);
        expect(application.edited).toEqual([]);
        expect(application.deleted).toEqual([]);
        // The existing commands are read once per bot, not on every sync.
        expect(application.fetched).toEqual(1);
    });

    it("updates the description when the flow changed it", async () => {
        await syncSlashCommands([{ token: "token-a", name: "ping", description: "Old" }]);
        await syncSlashCommands([{ token: "token-a", name: "ping", description: "New" }]);

        expect(application.created).toHaveLength(1);
        expect(application.edited).toEqual([{ id: "100", description: "New" }]);
    });

    it("removes the command once its flow is gone", async () => {
        await syncSlashCommands([{ token: "token-a", name: "ping", description: "Answers with pong" }]);
        await syncSlashCommands([]);

        expect(application.deleted).toEqual(["100"]);
        expect(application.commands.size).toEqual(0);
    });

    it("keeps commands the bot has for other reasons", async () => {
        application = fakeManager([{ id: "999", name: "unrelated", description: "Not ours" }]);
        clients.set("token-a", fakeClient(application));

        await syncSlashCommands([{ token: "token-a", name: "ping", description: "Answers with pong" }]);
        await syncSlashCommands([]);

        expect(application.deleted).toEqual(["100"]);
        expect(Array.from(application.commands.values())).toEqual([{ id: "999", name: "unrelated", description: "Not ours" }]);
    });

    it("takes over a command of the same name instead of creating a second one", async () => {
        application = fakeManager([{ id: "42", name: "ping", description: "Answers with pong" }]);
        clients.set("token-a", fakeClient(application));

        await syncSlashCommands([{ token: "token-a", name: "ping", description: "Answers with pong" }]);

        expect(application.created).toEqual([]);

        await syncSlashCommands([]);
        expect(application.deleted).toEqual(["42"]);
    });

    it("registers a command with a server id in that server only", async () => {
        const guild = fakeManager();
        clients.set("token-a", fakeClient(application, { "979757183623364678": guild }));

        await syncSlashCommands([
            { token: "token-a", name: "ping", description: "Answers with pong", guildId: "979757183623364678" },
        ]);

        expect(guild.created).toEqual([{ name: "ping", description: "Answers with pong" }]);
        expect(application.created).toEqual([]);
    });

    it("keeps the commands of one bot out of the sync of another", async () => {
        const second = fakeManager();
        clients.set("token-b", fakeClient(second));

        await syncSlashCommands([
            { token: "token-a", name: "ping", description: "A" },
            { token: "token-b", name: "status", description: "B" },
        ]);
        await syncSlashCommands([{ token: "token-a", name: "ping", description: "A" }]);

        expect(application.deleted).toEqual([]);
        expect(second.deleted).toEqual(["100"]);
    });
});
