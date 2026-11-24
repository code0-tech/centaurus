import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { RuntimeError } from "@code0-tech/hercules";
import { fetchMessage, handleDiscordError, mapDiscordReaction } from "../../helpers.js";
import { DiscordReactionType } from "../../data_types/discordReaction.js";

@Identifier("discordAddReaction")
@Signature("(botToken: string, channelId: string, messageId: string, emoji: string): DISCORD_REACTION")
@Name({ code: "en-US", content: "Add reaction" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Add reaction ${emoji}" })
@Documentation({ code: "en-US", content: "Reacts to a message with a unicode or custom emoji and returns the reaction." })
@Description({ code: "en-US", content: "React with a unicode or custom emoji." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that adds the reaction." }],
})
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
    description: [{ code: "en-US", content: "Unicode emoji or custom emoji (e.g. 👍 or name:id)." }],
})
export class DiscordAddReactionFunction {
    async run(
        _context: unknown,
        botToken: string,
        channelId: string,
        messageId: string,
        emoji: string
    ): Promise<DiscordReactionType> {
        try {
            const client = await getDiscordClient(botToken);
            if (!client.user) {
                throw new RuntimeError("DISCORD_UNKNOWN_BOT_USER", "The Discord bot did not report its own user.");
            }

            const target = await fetchMessage(client, channelId, messageId);
            const reaction = await target.react(emoji);

            // The reaction belongs to the bot itself - it is the one reacting.
            return mapDiscordReaction(reaction, client.user);
        } catch (error) {
            return handleDiscordError(error, "ERROR_ADDING_REACTION", "Failed to add reaction to Discord message.");
        }
    }
}
