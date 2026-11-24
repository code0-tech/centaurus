import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

@Identifier("DiscordReactionAdded")
@DisplayIcon("simple:discord")
@Name({ code: "en-US", content: "Discord reaction added" })
@Description({ code: "en-US", content: "Triggered when a user adds a reaction to a message. Ignores reactions of bots." })
@DisplayMessage({ code: "en-US", content: "Discord reaction added" })
@Signature("(botToken: string, channelId?: string, emoji?: string): DISCORD_REACTION")
@EventSetting({
    identifier: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that listens for reactions." }],
})
@EventSetting({
    identifier: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "Only react to reactions in this channel. Empty reacts to every channel." }],
    optional: true,
})
@EventSetting({
    identifier: "emoji",
    name: [{ code: "en-US", content: "Emoji" }],
    description: [{ code: "en-US", content: "Only react to this emoji. Empty reacts to every emoji." }],
    optional: true,
})
export class DiscordReactionAdded {}
