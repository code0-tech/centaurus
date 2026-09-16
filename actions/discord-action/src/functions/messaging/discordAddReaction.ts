import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { handleDiscordError } from "../../helpers.js";

@Identifier("discordAddReaction")
@Signature("(channelId: string, messageId: string, emoji: string): BOOLEAN")
@Name({ code: "en-US", content: "Add reaction" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Add reaction ${emoji}" })
@Documentation({ code: "en-US", content: "Reacts to a message with a unicode or custom emoji." })
@Description({ code: "en-US", content: "React with a unicode or custom emoji." })
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel." }],
})
@Parameter({
    runtimeName: "messageId",
    name: [{ code: "en-US", content: "Message ID" }],
    description: [{ code: "en-US", content: "The ID of the message to react to." }],
})
@Parameter({
    runtimeName: "emoji",
    name: [{ code: "en-US", content: "Emoji" }],
    description: [{ code: "en-US", content: "Unicode emoji or custom emoji (e.g. 👍 or emoji ID)." }],
})
export class DiscordAddReactionFunction {
    async run(_context: unknown, channelId: string, messageId: string, emoji: string): Promise<boolean> {
        try {
            const client = getDiscordClient();
            if (!client) throw new Error("Discord client is not initialized.");

            const channel = await client.channels.fetch(channelId);
            if (!channel || !channel.isTextBased() || !("messages" in channel)) {
                throw new Error(`Channel ${channelId} is not a text channel.`);
            }

            const targetMsg = await channel.messages.fetch(messageId);
            if (!targetMsg) throw new Error(`Message ${messageId} not found.`);

            await targetMsg.react(emoji);
            return true;
        } catch (error) {
            return handleDiscordError(error, "ERROR_ADDING_REACTION", "Failed to add reaction to Discord message.");
        }
    }
}
