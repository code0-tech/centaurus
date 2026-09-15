import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { handleDiscordError, mapDiscordMessage } from "../../helpers.js";
import { DiscordMessageType } from "../../data_types/discordMessage.js";

@Identifier("discordEditMessage")
@Signature("(channelId: string, messageId: string, content: string): DISCORD_MESSAGE")
@Name({ code: "en-US", content: "Edit message" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Edit message" })
@Documentation({ code: "en-US", content: "Edits a message previously sent by the bot." })
@Description({ code: "en-US", content: "Edit a message previously sent by the bot." })
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
    description: [{ code: "en-US", content: "The new content for the message." }],
})
export class DiscordEditMessageFunction {
    async run(_context: unknown, channelId: string, messageId: string, content: string): Promise<DiscordMessageType> {
        try {
            const client = getDiscordClient();
            if (!client) throw new Error("Discord client is not initialized.");

            const channel = await client.channels.fetch(channelId);
            if (!channel || !channel.isTextBased() || !("messages" in channel)) {
                throw new Error(`Channel ${channelId} is not a text channel.`);
            }

            const targetMsg = await channel.messages.fetch(messageId);
            if (!targetMsg) throw new Error(`Message ${messageId} not found.`);

            const editedMsg = await targetMsg.edit({
                content: content,
            });

            return mapDiscordMessage(editedMsg);
        } catch (error) {
            return handleDiscordError(error, "ERROR_EDITING_MESSAGE", "Failed to edit Discord message.");
        }
    }
}
