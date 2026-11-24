import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

@Identifier("DiscordSlashCommandInvoked")
@DisplayIcon("simple:discord")
@Name({ code: "en-US", content: "Discord slash command invoked" })
@Description({ code: "en-US", content: "Registers a slash command for the bot and is triggered when a user runs it." })
@DisplayMessage({ code: "en-US", content: "Slash command /${commandName} invoked" })
@Signature("(botToken: string, commandName: string, description: string, guildId?: string): DISCORD_COMMAND_INTERACTION")
@EventSetting({
    identifier: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot the slash command belongs to." }],
})
@EventSetting({
    identifier: "commandName",
    name: [{ code: "en-US", content: "Command name" }],
    description: [{ code: "en-US", content: "The name of the slash command, without the leading slash (e.g. ping)." }],
})
@EventSetting({
    identifier: "description",
    name: [{ code: "en-US", content: "Command description" }],
    description: [{ code: "en-US", content: "The description Discord shows next to the command. At most 100 characters." }],
})
@EventSetting({
    identifier: "guildId",
    name: [{ code: "en-US", content: "Server ID" }],
    description: [{ code: "en-US", content: "Register the command in this server only. Empty registers it for every server of the bot." }],
    optional: true,
})
export class DiscordSlashCommandInvoked {}
