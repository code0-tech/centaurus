import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { createDiscordEmbedBuilder, handleDiscordError, mapDiscordMessage } from "../../helpers.js";
import { DiscordEmbedType } from "../../data_types/discordEmbed.js";
import { DiscordMessageType } from "../../data_types/discordMessage.js";

@Identifier("discordReplyToMessage")
@Signature("(channelId: string, messageId: string, content: string, embed?: DISCORD_EMBED): DISCORD_MESSAGE")
@Name({ code: "en-US", content: "Reply to message" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Reply to message" })
@Documentation({ code: "en-US", content: "Replies to a specific message in a channel." })
@Description({ code: "en-US", content: "Reply with message reference." })
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the target channel." }],
})
@Parameter({
    runtimeName: "messageId",
    name: [{ code: "en-US", content: "Message ID" }],
    description: [{ code: "en-US", content: "The ID of the message to reply to." }],
})
@Parameter({
    runtimeName: "content",
    name: [{ code: "en-US", content: "Content" }],
    description: [{ code: "en-US", content: "The text content of the reply." }],
})
@Parameter({
    runtimeName: "embed",
    name: [{ code: "en-US", content: "Embed" }],
    description: [{ code: "en-US", content: "Optional DISCORD_EMBED object." }],
    optional: true,
})
export class DiscordReplyToMessageFunction {
    async run(
        _context: unknown,
        channelId: string,
        messageId: string,
        content: string,
        embed?: DiscordEmbedType
    ): Promise<DiscordMessageType> {
        try {
            const client = getDiscordClient();
            if (!client) throw new Error("Discord client is not initialized.");

            const channel = await client.channels.fetch(channelId);
            if (!channel || !channel.isTextBased() || !("messages" in channel)) {
                throw new Error(`Channel ${channelId} is not a text channel.`);
            }

            const targetMsg = await channel.messages.fetch(messageId);
            if (!targetMsg) throw new Error(`Message ${messageId} not found.`);

            const embeds = [];
            if (embed) {
                const builder = createDiscordEmbedBuilder(embed);
                if (builder) embeds.push(builder);
            }

            const replyMsg = await targetMsg.reply({
                content: content || undefined,
                embeds: embeds.length > 0 ? embeds : undefined,
            });

            return mapDiscordMessage(replyMsg);
        } catch (error) {
            return handleDiscordError(error, "ERROR_REPLYING_TO_MESSAGE", "Failed to reply to Discord message.");
        }
    }
}
