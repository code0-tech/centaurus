import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { fetchGuild, handleDiscordError, mapDiscordGuildMember } from "../../helpers.js";
import { DiscordGuildMemberType } from "../../data_types/discordGuildMember.js";

/** Discord returns at most 1000 members per request. */
const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 100;

@Identifier("discordGetGuildMembers")
@Signature("(botToken: string, guildId: string, limit?: number): DISCORD_GUILD_MEMBER[]")
@Name({ code: "en-US", content: "Get members" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Get members of server" })
@Documentation({
    code: "en-US",
    content: "Reads the members of a server. Needs the Server Members intent. At most 1000 per call.",
})
@Description({ code: "en-US", content: "Read the members of a server." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that reads the members." }],
})
@Parameter({
    runtimeName: "guildId",
    name: [{ code: "en-US", content: "Server ID" }],
    description: [{ code: "en-US", content: "The ID of the server to read the members of." }],
})
@Parameter({
    runtimeName: "limit",
    name: [{ code: "en-US", content: "Number of members" }],
    description: [{ code: "en-US", content: "How many members to read, 1 to 1000. Empty reads 100." }],
    optional: true,
})
export class DiscordGetGuildMembersFunction {
    async run(
        _context: unknown,
        botToken: string,
        guildId: string,
        limit?: number
    ): Promise<DiscordGuildMemberType[]> {
        try {
            const client = await getDiscordClient(botToken);
            const guild = await fetchGuild(client, guildId);
            const members = await guild.members.fetch({ limit: boundedLimit(limit) });

            return members.map(mapDiscordGuildMember);
        } catch (error) {
            return handleDiscordError(error, "ERROR_READING_MEMBERS", "Failed to read the Discord members.");
        }
    }
}

function boundedLimit(limit?: number): number {
    if (limit === undefined || limit === null || Number.isNaN(Number(limit))) return DEFAULT_LIMIT;

    return Math.min(Math.max(Math.trunc(Number(limit)), 1), MAX_LIMIT);
}
