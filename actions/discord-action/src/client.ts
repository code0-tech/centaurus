import { Client, GatewayIntentBits, Partials } from "discord.js";

let clientInstance: Client | null = null;
let currentToken: string | null = null;

export function getDiscordClient(): Client | null {
    return clientInstance;
}

export async function initDiscordClient(
    token: string,
    onError?: (err: Error) => void
): Promise<Client> {
    if (clientInstance && currentToken === token && clientInstance.isReady()) {
        return clientInstance;
    }

    if (clientInstance) {
        try {
            await clientInstance.destroy();
        } catch {
            // Ignore destruction errors
        }
        clientInstance = null;
    }

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessageReactions,
        ],
        partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    });

    client.on("error", (error) => {
        console.error("Discord Client Error:", error.message);
        if (onError) {
            onError(error);
        }
    });

    try {
        await client.login(token);
        clientInstance = client;
        currentToken = token;
        console.log(`Discord bot logged in as ${client.user?.tag}`);
        return client;
    } catch (err: any) {
        console.error("Failed to log in Discord bot:", err?.message || err);
        if (onError) {
            onError(err instanceof Error ? err : new Error(String(err)));
        }
        throw err;
    }
}
