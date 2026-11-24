import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { buildMessagePayload, fetchTextChannel, handleDiscordError, mapDiscordMessage } from "../../helpers.js";
import { DiscordEmbedType } from "../../data_types/discordEmbed.js";
import { DiscordMessageType } from "../../data_types/discordMessage.js";

@Identifier("discordSendMessage")
@Signature("(botToken: string, channelId: string, content?: string, embed?: DISCORD_EMBED): DISCORD_MESSAGE")
@Name({ code: "en-US", content: "Send message" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Send message to channel" })
@Documentation({ code: "en-US", content: "Sends a message with text content and/or an embed to a Discord channel." })
@Description({ code: "en-US", content: "Send a message to a channel." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that sends the message." }],
})
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the target channel." }],
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
export class DiscordSendMessageFunction {
    async run(
        _context: unknown,
        botToken: string,
        channelId: string,
        content?: string,
        embed?: DiscordEmbedType
    ): Promise<DiscordMessageType> {
        try {
            const client = await getDiscordClient(botToken);
            const channel = await fetchTextChannel(client, channelId);
            const message = await channel.send(buildMessagePayload(content, embed));

            return mapDiscordMessage(message);
        } catch (error) {
            return handleDiscordError(error, "ERROR_SENDING_MESSAGE", "Failed to send message to Discord channel.");
        }
    }
}
