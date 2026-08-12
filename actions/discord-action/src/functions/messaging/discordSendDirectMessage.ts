import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { createDiscordEmbedBuilder, handleDiscordError, mapDiscordMessage } from "../../helpers.js";
import { DiscordEmbedType } from "../../data_types/discordEmbed.js";
import { DiscordMessageType } from "../../data_types/discordMessage.js";

@Identifier("discordSendDirectMessage")
@Signature("(userId: string, content: string, embed?: DISCORD_EMBED): DISCORD_MESSAGE")
@Name({ code: "en-US", content: "Send direct message" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Send direct message" })
@Documentation({ code: "en-US", content: "Opens a DM channel with a user and sends a message." })
@Description({ code: "en-US", content: "Open a DM channel and send a message." })
@Parameter({
    runtimeName: "userId",
    name: [{ code: "en-US", content: "User ID" }],
    description: [{ code: "en-US", content: "The ID of the target user." }],
})
@Parameter({
    runtimeName: "content",
    name: [{ code: "en-US", content: "Content" }],
    description: [{ code: "en-US", content: "The text content of the message." }],
})
@Parameter({
    runtimeName: "embed",
    name: [{ code: "en-US", content: "Embed" }],
    description: [{ code: "en-US", content: "Optional DISCORD_EMBED object." }],
    optional: true,
})
export class DiscordSendDirectMessageFunction {
    async run(_context: unknown, userId: string, content: string, embed?: DiscordEmbedType): Promise<DiscordMessageType> {
        try {
            const client = getDiscordClient();
            if (!client) throw new Error("Discord client is not initialized.");

            const user = await client.users.fetch(userId);
            if (!user) throw new Error(`User ${userId} not found.`);

            const embeds = [];
            if (embed) {
                const builder = createDiscordEmbedBuilder(embed);
                if (builder) embeds.push(builder);
            }

            const msg = await user.send({
                content: content || undefined,
                embeds: embeds.length > 0 ? embeds : undefined,
            });

            return mapDiscordMessage(msg);
        } catch (error) {
            return handleDiscordError(error, "ERROR_SENDING_DM", "Failed to send DM to Discord user.");
        }
    }
}
