import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

@Identifier("DiscordMessageCreated")
@DisplayIcon("simple:discord")
@Name({ code: "en-US", content: "Discord message created" })
@Description({ code: "en-US", content: "Triggered when a message is posted in a channel. Ignores messages sent by bots." })
@DisplayMessage({ code: "en-US", content: "Discord message created" })
@Signature("(botToken: string, channelId?: string): DISCORD_MESSAGE")
@EventSetting({
    identifier: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that listens for messages." }],
})
@EventSetting({
    identifier: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "Only react to messages in this channel. Empty reacts to every channel." }],
    optional: true,
})
export class DiscordMessageCreated {}
