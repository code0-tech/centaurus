import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { handleDiscordError, mapDiscordGuildMember } from "../../helpers.js";
import { DiscordGuildMemberType } from "../../data_types/discordGuildMember.js";

@Identifier("discordAddRoleToMember")
@Signature("(guildId: string, userId: string, roleId: string): DISCORD_GUILD_MEMBER")
@Name({ code: "en-US", content: "Add role to member" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Add role to member" })
@Documentation({ code: "en-US", content: "Assigns a role to a guild member." })
@Description({ code: "en-US", content: "Assign a role." })
@Parameter({
    runtimeName: "guildId",
    name: [{ code: "en-US", content: "Guild ID" }],
    description: [{ code: "en-US", content: "The ID of the server/guild." }],
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
    async run(_context: unknown, guildId: string, userId: string, roleId: string): Promise<DiscordGuildMemberType> {
        try {
            const client = getDiscordClient();
            if (!client) throw new Error("Discord client is not initialized.");

            const guild = await client.guilds.fetch(guildId);
            if (!guild) throw new Error(`Guild ${guildId} not found.`);

            const member = await guild.members.fetch(userId);
            if (!member) throw new Error(`Member ${userId} not found in guild.`);

            const updatedMember = await member.roles.add(roleId);
            return mapDiscordGuildMember(updatedMember);
        } catch (error) {
            return handleDiscordError(error, "ERROR_ADDING_ROLE", "Failed to add role to Discord member.");
        }
    }
}
