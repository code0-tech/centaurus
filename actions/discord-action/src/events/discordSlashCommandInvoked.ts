import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

@Identifier("DiscordSlashCommandInvoked")
@DisplayIcon("simple:discord")
@Name({ code: "en-US", content: "Discord slash command invoked" })
@Description({ code: "en-US", content: "Triggered when a slash command is executed by a user." })
@DisplayMessage({ code: "en-US", content: "Slash command /${commandName} invoked" })
@Signature("(commandName: string): DISCORD_COMMAND_INTERACTION")
@EventSetting({
    identifier: "commandName",
    name: [{ code: "en-US", content: "Command Name" }],
    description: [{ code: "en-US", content: "The slash command name (e.g. ping)." }],
})
export class DiscordSlashCommandInvoked {}
