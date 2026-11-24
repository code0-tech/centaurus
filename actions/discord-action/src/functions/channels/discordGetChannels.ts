import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { fetchGuild, handleDiscordError, mapDiscordChannel } from "../../helpers.js";
import { DiscordChannelDataType } from "../../data_types/discordChannel.js";

@Identifier("discordGetChannels")
@Signature("(botToken: string, guildId: string): DISCORD_CHANNEL[]")
@Name({ code: "en-US", content: "Get channels" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Get channels of server" })
@Documentation({ code: "en-US", content: "Reads every channel of a server the bot can see." })
@Description({ code: "en-US", content: "Read the channels of a server." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that reads the channels." }],
})
@Parameter({
    runtimeName: "guildId",
    name: [{ code: "en-US", content: "Server ID" }],
    description: [{ code: "en-US", content: "The ID of the server to read the channels of." }],
})
export class DiscordGetChannelsFunction {
    async run(_context: unknown, botToken: string, guildId: string): Promise<DiscordChannelDataType[]> {
        try {
            const client = await getDiscordClient(botToken);
            const guild = await fetchGuild(client, guildId);
            const channels = await guild.channels.fetch();

            // A channel the bot may not see comes back as null.
            return Array.from(channels.values())
                .filter((channel) => channel !== null)
                .map(mapDiscordChannel);
        } catch (error) {
            return handleDiscordError(error, "ERROR_READING_CHANNELS", "Failed to read the Discord channels.");
        }
    }
}
