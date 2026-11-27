import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

@Identifier("DiscordMemberLeft")
@DisplayIcon("simple:discord")
@Name({ code: "en-US", content: "Discord member left" })
@Description({ code: "en-US", content: "Triggered when a member leaves a server." })
@DisplayMessage({ code: "en-US", content: "Discord member left" })
@Signature("(botToken: string, guildId?: string): DISCORD_GUILD_MEMBER")
@EventSetting({
    identifier: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot that listens for leaving members." }],
})
@EventSetting({
    identifier: "guildId",
    name: [{ code: "en-US", content: "Server ID" }],
    description: [{ code: "en-US", content: "Only react to members of this server. Empty reacts to every server." }],
    optional: true,
})
export class DiscordMemberLeft {}
