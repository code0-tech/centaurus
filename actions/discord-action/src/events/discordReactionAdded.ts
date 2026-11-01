import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

@Identifier("DiscordReactionAdded")
@DisplayIcon("simple:discord")
@Name({ code: "en-US", content: "Discord reaction added" })
@Description({ code: "en-US", content: "Triggered when a user adds a reaction to a message." })
@DisplayMessage({ code: "en-US", content: "Discord reaction added" })
@Signature("(channelId?: string): DISCORD_REACTION")
@EventSetting({
    identifier: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "Optional channel ID to filter reactions." }],
    optional: true,
})
export class DiscordReactionAdded {}
