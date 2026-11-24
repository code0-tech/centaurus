import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { RuntimeError } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { buildMessagePayload, handleDiscordError, mapDiscordMessage } from "../../helpers.js";
import { DiscordEmbedType } from "../../data_types/discordEmbed.js";
import { DiscordMessageType } from "../../data_types/discordMessage.js";

@Identifier("discordSendDirectMessage")
@Signature("(botToken: string, userId: string, content?: string, embed?: DISCORD_EMBED): DISCORD_MESSAGE")
@Name({ code: "en-US", content: "Send direct message" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Send direct message" })
@Documentation({ code: "en-US", content: "Opens a direct message channel with a user and sends a message." })
@Description({ code: "en-US", content: "Open a DM channel and send a message." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that sends the message." }],
})
@Parameter({
    runtimeName: "userId",
    name: [{ code: "en-US", content: "User ID" }],
    description: [{ code: "en-US", content: "The ID of the target user." }],
})
@Parameter({
    runtimeName: "content",
    name: [{ code: "en-US", content: "Content" }],
    description: [{ code: "en-US", content: "The text content of the message." }],
    optional: true,
})
@Parameter({
    runtimeName: "embed",
    name: [{ code: "en-US", content: "Embed" }],
    description: [{ code: "en-US", content: "Optional embed to send with the message." }],
    optional: true,
})
export class DiscordSendDirectMessageFunction {
    async run(
        _context: unknown,
        botToken: string,
        userId: string,
        content?: string,
        embed?: DiscordEmbedType
    ): Promise<DiscordMessageType> {
        try {
            const client = await getDiscordClient(botToken);
            const user = await client.users.fetch(userId);
            if (!user) {
                throw new RuntimeError("DISCORD_UNKNOWN_USER", `User ${userId} was not found.`);
            }

            const message = await user.send(buildMessagePayload(content, embed));

            return mapDiscordMessage(message);
        } catch (error) {
            return handleDiscordError(error, "ERROR_SENDING_DM", "Failed to send DM to Discord user.");
        }
    }
}
