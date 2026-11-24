import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { fetchMessage, handleDiscordError, mapDiscordMessage } from "../../helpers.js";
import { DiscordMessageType } from "../../data_types/discordMessage.js";

@Identifier("discordDeleteMessage")
@Signature("(botToken: string, channelId: string, messageId: string): DISCORD_MESSAGE")
@Name({ code: "en-US", content: "Delete message" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Delete message" })
@Documentation({ code: "en-US", content: "Deletes a message from a channel and returns the message that was deleted." })
@Description({ code: "en-US", content: "Delete a message." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that deletes the message." }],
})
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel." }],
})
@Parameter({
    runtimeName: "messageId",
    name: [{ code: "en-US", content: "Message ID" }],
    description: [{ code: "en-US", content: "The ID of the message to delete." }],
})
export class DiscordDeleteMessageFunction {
    async run(
        _context: unknown,
        botToken: string,
        channelId: string,
        messageId: string
    ): Promise<DiscordMessageType> {
        try {
            const client = await getDiscordClient(botToken);
            const target = await fetchMessage(client, channelId, messageId);

            // `delete` resolves with the message as it was, so the flow can
            // still work with what it just removed.
            return mapDiscordMessage(await target.delete());
        } catch (error) {
            return handleDiscordError(error, "ERROR_DELETING_MESSAGE", "Failed to delete Discord message.");
        }
    }
}
