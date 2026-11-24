import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { fetchTextChannel, handleDiscordError, mapDiscordMessage } from "../../helpers.js";
import { DiscordMessageType } from "../../data_types/discordMessage.js";

/** Discord returns at most 100 messages per request. */
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

@Identifier("discordGetMessages")
@Signature("(botToken: string, channelId: string, limit?: number): DISCORD_MESSAGE[]")
@Name({ code: "en-US", content: "Get messages" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Get messages of channel" })
@Documentation({ code: "en-US", content: "Reads the latest messages of a channel, newest first. At most 100 per call." })
@Description({ code: "en-US", content: "Read the latest messages of a channel." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that reads the messages." }],
})
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel to read." }],
})
@Parameter({
    runtimeName: "limit",
    name: [{ code: "en-US", content: "Number of messages" }],
    description: [{ code: "en-US", content: "How many messages to read, 1 to 100. Empty reads 50." }],
    optional: true,
})
export class DiscordGetMessagesFunction {
    async run(
        _context: unknown,
        botToken: string,
        channelId: string,
        limit?: number
    ): Promise<DiscordMessageType[]> {
        try {
            const client = await getDiscordClient(botToken);
            const channel = await fetchTextChannel(client, channelId);
            const messages = await channel.messages.fetch({ limit: boundedLimit(limit) });

            return messages.map(mapDiscordMessage);
        } catch (error) {
            return handleDiscordError(error, "ERROR_READING_MESSAGES", "Failed to read the Discord messages.");
        }
    }
}

function boundedLimit(limit?: number): number {
    if (limit === undefined || limit === null || Number.isNaN(Number(limit))) return DEFAULT_LIMIT;

    return Math.min(Math.max(Math.trunc(Number(limit)), 1), MAX_LIMIT);
}
