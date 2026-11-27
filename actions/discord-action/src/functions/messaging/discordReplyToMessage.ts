import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { buildMessagePayload, fetchMessage, handleDiscordError, mapDiscordMessage } from "../../helpers.js";
import { DiscordEmbedType } from "../../data_types/discordEmbed.js";
import { DiscordMessageType } from "../../data_types/discordMessage.js";

@Identifier("discordReplyToMessage")
@Signature("(botToken: string, channelId: string, messageId: string, content?: string, embed?: DISCORD_EMBED): DISCORD_MESSAGE")
@Name({ code: "en-US", content: "Reply to message" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Reply to message" })
@Documentation({ code: "en-US", content: "Replies to a specific message in a channel." })
@Description({ code: "en-US", content: "Reply with message reference." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that sends the reply." }],
})
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
    optional: true,
})
@Parameter({
    runtimeName: "embed",
    name: [{ code: "en-US", content: "Embed" }],
    description: [{ code: "en-US", content: "Optional embed to send with the reply." }],
    optional: true,
})
export class DiscordReplyToMessageFunction {
    async run(
        _context: unknown,
        botToken: string,
        channelId: string,
        messageId: string,
        content?: string,
        embed?: DiscordEmbedType
    ): Promise<DiscordMessageType> {
        try {
            const client = await getDiscordClient(botToken);
            const target = await fetchMessage(client, channelId, messageId);
            const reply = await target.reply(buildMessagePayload(content, embed));

            return mapDiscordMessage(reply);
        } catch (error) {
            return handleDiscordError(error, "ERROR_REPLYING_TO_MESSAGE", "Failed to reply to Discord message.");
        }
    }
}
