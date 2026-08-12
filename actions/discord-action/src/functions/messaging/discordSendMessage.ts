import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { createDiscordEmbedBuilder, handleDiscordError, mapDiscordMessage } from "../../helpers.js";
import { DiscordEmbedType } from "../../data_types/discordEmbed.js";
import { DiscordMessageType } from "../../data_types/discordMessage.js";

@Identifier("discordSendMessage")
@Signature("(channelId: string, content: string, embed?: DISCORD_EMBED): DISCORD_MESSAGE")
@Name({ code: "en-US", content: "Send message" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Send message to channel" })
@Documentation({ code: "en-US", content: "Sends a message with optional text content and embed to a Discord channel." })
@Description({ code: "en-US", content: "Send a message to a channel." })
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the target channel." }],
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
export class DiscordSendMessageFunction {
    async run(_context: unknown, channelId: string, content: string, embed?: DiscordEmbedType): Promise<DiscordMessageType> {
        try {
            const client = getDiscordClient();
            if (!client) throw new Error("Discord client is not initialized.");

            const channel = await client.channels.fetch(channelId);
            if (!channel || !channel.isTextBased() || !("send" in channel)) {
                throw new Error(`Channel ${channelId} is not a valid text channel.`);
            }

            const embeds = [];
            if (embed) {
                const builder = createDiscordEmbedBuilder(embed);
                if (builder) embeds.push(builder);
            }

            const msg = await channel.send({
                content: content || undefined,
                embeds: embeds.length > 0 ? embeds : undefined,
            });

            return mapDiscordMessage(msg);
        } catch (error) {
            return handleDiscordError(error, "ERROR_SENDING_MESSAGE", "Failed to send message to Discord channel.");
        }
    }
}
