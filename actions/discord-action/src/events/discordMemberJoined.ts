import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Signature } from "@code0-tech/hercules";

@Identifier("DiscordMemberJoined")
@DisplayIcon("simple:discord")
@Name({ code: "en-US", content: "Discord member joined" })
@Description({ code: "en-US", content: "Triggered when a new member joins a guild." })
@DisplayMessage({ code: "en-US", content: "Discord member joined" })
@Signature("(): DISCORD_GUILD_MEMBER")
export class DiscordMemberJoined {}
