import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { fetchGuild, handleDiscordError, mapDiscordRole } from "../../helpers.js";
import { DiscordRoleType } from "../../data_types/discordRole.js";

@Identifier("discordGetRoles")
@Signature("(botToken: string, guildId: string): DISCORD_ROLE[]")
@Name({ code: "en-US", content: "Get roles" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Get roles of server" })
@Documentation({ code: "en-US", content: "Reads every role of a server, e.g. to find the ID of a role by its name." })
@Description({ code: "en-US", content: "Read the roles of a server." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that reads the roles." }],
})
@Parameter({
    runtimeName: "guildId",
    name: [{ code: "en-US", content: "Server ID" }],
    description: [{ code: "en-US", content: "The ID of the server to read the roles of." }],
})
export class DiscordGetRolesFunction {
    async run(_context: unknown, botToken: string, guildId: string): Promise<DiscordRoleType[]> {
        try {
            const client = await getDiscordClient(botToken);
            const guild = await fetchGuild(client, guildId);
            const roles = await guild.roles.fetch();

            return Array.from(roles.values()).map(mapDiscordRole);
        } catch (error) {
            return handleDiscordError(error, "ERROR_READING_ROLES", "Failed to read the Discord roles.");
        }
    }
}
