import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { fetchGuildMember, handleDiscordError, mapDiscordGuildMember } from "../../helpers.js";
import { DiscordGuildMemberType } from "../../data_types/discordGuildMember.js";

@Identifier("discordGetGuildMember")
@Signature("(botToken: string, guildId: string, userId: string): DISCORD_GUILD_MEMBER")
@Name({ code: "en-US", content: "Get member" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Get member of server" })
@Documentation({ code: "en-US", content: "Reads a member of a server, including their nickname and role IDs." })
@Description({ code: "en-US", content: "Read a member of a server." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that reads the member." }],
})
@Parameter({
    runtimeName: "guildId",
    name: [{ code: "en-US", content: "Server ID" }],
    description: [{ code: "en-US", content: "The ID of the server the member is in." }],
})
@Parameter({
    runtimeName: "userId",
    name: [{ code: "en-US", content: "User ID" }],
    description: [{ code: "en-US", content: "The ID of the user to read." }],
})
export class DiscordGetGuildMemberFunction {
    async run(
        _context: unknown,
        botToken: string,
        guildId: string,
        userId: string
    ): Promise<DiscordGuildMemberType> {
        try {
            const client = await getDiscordClient(botToken);

            return mapDiscordGuildMember(await fetchGuildMember(client, guildId, userId));
        } catch (error) {
            return handleDiscordError(error, "ERROR_READING_MEMBER", "Failed to read the Discord member.");
        }
    }
}
