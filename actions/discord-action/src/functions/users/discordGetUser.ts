import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { handleDiscordError, mapDiscordUser } from "../../helpers.js";
import { DiscordUserType } from "../../data_types/discordUser.js";

@Identifier("discordGetUser")
@Signature("(botToken: string, userId: string): DISCORD_USER")
@Name({ code: "en-US", content: "Get user" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Get user" })
@Documentation({ code: "en-US", content: "Reads a Discord user by their ID, independently of any server." })
@Description({ code: "en-US", content: "Read a user by their ID." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that reads the user." }],
})
@Parameter({
    runtimeName: "userId",
    name: [{ code: "en-US", content: "User ID" }],
    description: [{ code: "en-US", content: "The ID of the user to read." }],
})
export class DiscordGetUserFunction {
    async run(_context: unknown, botToken: string, userId: string): Promise<DiscordUserType> {
        try {
            const client = await getDiscordClient(botToken);
            const user = await client.users.fetch(userId);
            if (!user) {
                throw new RuntimeError("DISCORD_UNKNOWN_USER", `User ${userId} was not found.`);
            }

            return mapDiscordUser(user);
        } catch (error) {
            return handleDiscordError(error, "ERROR_READING_USER", "Failed to read the Discord user.");
        }
    }
}
