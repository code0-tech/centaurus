import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { fetchGuildMember, handleDiscordError, mapDiscordGuildMember } from "../../helpers.js";
import { DiscordGuildMemberType } from "../../data_types/discordGuildMember.js";

@Identifier("discordAddRoleToMember")
@Signature("(botToken: string, guildId: string, userId: string, roleId: string): DISCORD_GUILD_MEMBER")
@Name({ code: "en-US", content: "Add role to member" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Add role to member" })
@Documentation({ code: "en-US", content: "Assigns a role to a member of a server." })
@Description({ code: "en-US", content: "Assign a role." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that assigns the role." }],
})
@Parameter({
    runtimeName: "guildId",
    name: [{ code: "en-US", content: "Server ID" }],
    description: [{ code: "en-US", content: "The ID of the server." }],
})
@Parameter({
    runtimeName: "userId",
    name: [{ code: "en-US", content: "User ID" }],
    description: [{ code: "en-US", content: "The ID of the user." }],
})
@Parameter({
    runtimeName: "roleId",
    name: [{ code: "en-US", content: "Role ID" }],
    description: [{ code: "en-US", content: "The ID of the role to assign." }],
})
export class DiscordAddRoleToMemberFunction {
    async run(
        _context: unknown,
        botToken: string,
        guildId: string,
        userId: string,
        roleId: string
    ): Promise<DiscordGuildMemberType> {
        try {
            const client = await getDiscordClient(botToken);
            const member = await fetchGuildMember(client, guildId, userId);
            const updated = await member.roles.add(roleId);

            return mapDiscordGuildMember(updated);
        } catch (error) {
            return handleDiscordError(error, "ERROR_ADDING_ROLE", "Failed to add role to Discord member.");
        }
    }
}
