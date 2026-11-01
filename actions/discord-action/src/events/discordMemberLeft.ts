import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Signature } from "@code0-tech/hercules";

@Identifier("DiscordMemberLeft")
@DisplayIcon("simple:discord")
@Name({ code: "en-US", content: "Discord member left" })
@Description({ code: "en-US", content: "Triggered when a member leaves a guild." })
@DisplayMessage({ code: "en-US", content: "Discord member left" })
@Signature("(): DISCORD_GUILD_MEMBER")
export class DiscordMemberLeft {}
