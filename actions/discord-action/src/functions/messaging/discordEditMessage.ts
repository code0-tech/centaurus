import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { buildMessagePayload, fetchMessage, handleDiscordError, mapDiscordMessage } from "../../helpers.js";
import { DiscordEmbedType } from "../../data_types/discordEmbed.js";
import { DiscordMessageType } from "../../data_types/discordMessage.js";

@Identifier("discordEditMessage")
@Signature("(botToken: string, channelId: string, messageId: string, content?: string, embed?: DISCORD_EMBED): DISCORD_MESSAGE")
@Name({ code: "en-US", content: "Edit message" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Edit message" })
@Documentation({ code: "en-US", content: "Edits a message previously sent by the bot." })
@Description({ code: "en-US", content: "Edit a message previously sent by the bot." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that sent the message." }],
})
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the target channel." }],
})
@Parameter({
    runtimeName: "messageId",
    name: [{ code: "en-US", content: "Message ID" }],
    description: [{ code: "en-US", content: "The ID of the message to edit." }],
})
@Parameter({
    runtimeName: "content",
    name: [{ code: "en-US", content: "Content" }],
    description: [{ code: "en-US", content: "The new text content of the message." }],
    optional: true,
})
@Parameter({
    runtimeName: "embed",
    name: [{ code: "en-US", content: "Embed" }],
    description: [{ code: "en-US", content: "The new embed of the message." }],
    optional: true,
})
export class DiscordEditMessageFunction {
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
            const edited = await target.edit(buildMessagePayload(content, embed));

            return mapDiscordMessage(edited);
        } catch (error) {
            return handleDiscordError(error, "ERROR_EDITING_MESSAGE", "Failed to edit Discord message.");
        }
    }
}
