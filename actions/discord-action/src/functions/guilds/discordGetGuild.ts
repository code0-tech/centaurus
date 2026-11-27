import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { fetchGuild, handleDiscordError, mapDiscordGuild } from "../../helpers.js";
import { DiscordGuildType } from "../../data_types/discordGuild.js";

@Identifier("discordGetGuild")
@Signature("(botToken: string, guildId: string): DISCORD_GUILD")
@Name({ code: "en-US", content: "Get server" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Get server" })
@Documentation({ code: "en-US", content: "Reads a server by its ID, including its name, owner and member count." })
@Description({ code: "en-US", content: "Read a server by its ID." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that reads the server." }],
})
@Parameter({
    runtimeName: "guildId",
    name: [{ code: "en-US", content: "Server ID" }],
    description: [{ code: "en-US", content: "The ID of the server to read." }],
})
export class DiscordGetGuildFunction {
    async run(_context: unknown, botToken: string, guildId: string): Promise<DiscordGuildType> {
        try {
            const client = await getDiscordClient(botToken);

            return mapDiscordGuild(await fetchGuild(client, guildId));
        } catch (error) {
            return handleDiscordError(error, "ERROR_READING_GUILD", "Failed to read the Discord server.");
        }
    }
}
