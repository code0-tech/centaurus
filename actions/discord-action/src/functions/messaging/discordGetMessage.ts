import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { fetchMessage, handleDiscordError, mapDiscordMessage } from "../../helpers.js";
import { DiscordMessageType } from "../../data_types/discordMessage.js";

@Identifier("discordGetMessage")
@Signature("(botToken: string, channelId: string, messageId: string): DISCORD_MESSAGE")
@Name({ code: "en-US", content: "Get message" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Get message" })
@Documentation({ code: "en-US", content: "Reads a single message of a channel by its ID." })
@Description({ code: "en-US", content: "Read a message by its ID." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that reads the message." }],
})
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel the message is in." }],
})
@Parameter({
    runtimeName: "messageId",
    name: [{ code: "en-US", content: "Message ID" }],
    description: [{ code: "en-US", content: "The ID of the message to read." }],
})
export class DiscordGetMessageFunction {
    async run(
        _context: unknown,
        botToken: string,
        channelId: string,
        messageId: string
    ): Promise<DiscordMessageType> {
        try {
            const client = await getDiscordClient(botToken);

            return mapDiscordMessage(await fetchMessage(client, channelId, messageId));
        } catch (error) {
            return handleDiscordError(error, "ERROR_READING_MESSAGE", "Failed to read the Discord message.");
        }
    }
}
