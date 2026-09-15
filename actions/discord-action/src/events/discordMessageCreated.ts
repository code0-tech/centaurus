import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

@Identifier("DiscordMessageCreated")
@DisplayIcon("simple:discord")
@Name({ code: "en-US", content: "Discord message created" })
@Description({ code: "en-US", content: "Triggered when a message is posted in a channel. Ignores bot messages." })
@DisplayMessage({ code: "en-US", content: "Discord message created" })
@Signature("(channelId?: string): DISCORD_MESSAGE")
@EventSetting({
    identifier: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "Optional channel ID to filter incoming messages." }],
    optional: true,
})
export class DiscordMessageCreated {}
