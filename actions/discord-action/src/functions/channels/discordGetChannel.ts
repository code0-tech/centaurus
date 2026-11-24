import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getDiscordClient } from "../../client.js";
import { fetchChannel, handleDiscordError, mapDiscordChannel } from "../../helpers.js";
import { DiscordChannelDataType } from "../../data_types/discordChannel.js";

@Identifier("discordGetChannel")
@Signature("(botToken: string, channelId: string): DISCORD_CHANNEL")
@Name({ code: "en-US", content: "Get channel" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Get channel" })
@Documentation({ code: "en-US", content: "Reads a channel by its ID, including its name, type and topic." })
@Description({ code: "en-US", content: "Read a channel by its ID." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that reads the channel." }],
})
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel to read." }],
})
export class DiscordGetChannelFunction {
    async run(_context: unknown, botToken: string, channelId: string): Promise<DiscordChannelDataType> {
        try {
            const client = await getDiscordClient(botToken);

            return mapDiscordChannel(await fetchChannel(client, channelId));
        } catch (error) {
            return handleDiscordError(error, "ERROR_READING_CHANNEL", "Failed to read the Discord channel.");
        }
    }
}
