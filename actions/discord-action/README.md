# Discord Action

Discord bot integration for the **Hercules** automation platform.

The action holds no credentials of its own: **every runtime function and every
event takes the bot token it works with as its first parameter**, so one running
action serves as many Discord bots as its flows use. There is nothing to
configure on the module.

## Functions

| Function | Description |
|----------|-------------|
| `discordSendMessage` | Send a message (text and/or embed) to a channel. |
| `discordSendDirectMessage` | Open a DM channel with a user and send a message. |
| `discordReplyToMessage` | Reply to a message, keeping the message reference. |
| `discordEditMessage` | Edit a message the bot sent earlier. |
| `discordDeleteMessage` | Delete a message and get back the message that was deleted. |
| `discordAddReaction` | React to a message with a unicode or custom emoji. |
| `discordAnswerSlashCommand` | Answer the slash command that started the flow. |
| `discordGetMessage` | Read a message by its ID. |
| `discordGetMessages` | Read the latest messages of a channel (up to 100). |
| `discordGetChannel` | Read a channel by its ID. |
| `discordGetChannels` | Read the channels of a server. |
| `discordGetGuild` | Read a server by its ID. |
| `discordGetRoles` | Read the roles of a server. |
| `discordGetGuildMember` | Read a member of a server. |
| `discordGetGuildMembers` | Read the members of a server (up to 1000). |
| `discordGetUser` | Read a user by their ID. |
| `discordAddRoleToMember` | Assign a role to a member of a server. |
| `discordRemoveRoleFromMember` | Remove a role from a member of a server. |

Each one starts with the `botToken` parameter, followed by the Discord ids it
needs (e.g. `discordSendMessage(botToken, channelId, content?, embed?)`).

## Events

| Event | Fires when | Settings |
|-------|------------|----------|
| `DiscordMessageCreated` | A user posts a message. Bot messages are ignored. | `botToken`, `channelId?` |
| `DiscordReactionAdded` | A user reacts to a message. | `botToken`, `channelId?`, `emoji?` |
| `DiscordMemberJoined` | A member joins a server. | `botToken`, `guildId?` |
| `DiscordMemberLeft` | A member leaves a server. | `botToken`, `guildId?` |
| `DiscordSlashCommandInvoked` | A slash command of the bot is used. | `botToken`, `commandName`, `description`, `guildId?` |

An optional setting that is left empty is a wildcard — `DiscordMessageCreated`
without a channel id reacts to messages in every channel the bot can see.

### Slash commands

`DiscordSlashCommandInvoked` registers the command with Discord itself: a flow
with a command name and description creates it, a flow that is deleted removes it
again. With a server id the command is registered in that server only (visible
immediately) and the event fires for that server only; without one it is
registered for every server of the bot.

The command name is normalized the way Discord stores it — a leading slash is
dropped and the name is lower-cased, so `/Ping` and `ping` are the same command.
A name Discord would refuse (longer than 32 characters, or with spaces) is
logged and skipped.

Only commands a flow asks for are touched: a command the bot has for other
reasons is never deleted. The flip side is that a flow deleted while the action
was not running leaves its command in Discord — it is not claimed by any flow
afterwards, so nothing removes it. Deleting such a leftover is a manual step.

**Answering:** Discord expects a reaction within three seconds, which no flow can
promise. The action therefore acknowledges the command immediately — Discord
shows *"<bot> is thinking…"* — and puts `interactionToken` into the payload. The
flow replaces that placeholder with `discordAnswerSlashCommand(botToken,
interactionToken, content?, embed?)`, any time within Discord's 15 minute window.
A later call overwrites the answer again.

A flow that never calls it leaves the placeholder standing; posting into the
channel with `discordSendMessage` instead is a normal message without any link to
the command.

Slash commands are registered without options, so `options` in the payload stays
empty unless the command was given options elsewhere.

## Payloads always carry every field

Everything a function returns and every event payload contains **all** fields of
its data type: what Discord did not send is `null`, never missing. A message
without a reply therefore has `referencedMessageId: null`, so a flow reading it
resolves the reference instead of failing with `ReferenceValueNotFound`. The
optional fields of the data types are declared nullable, so an embed passed
*into* a function may still omit them.

## Bot setup

The gateway connection the events use needs two privileged intents, both enabled
under *Bot → Privileged Gateway Intents* in the
[Discord developer portal](https://discord.com/developers/applications):

- **Message Content** — for `DiscordMessageCreated` and reaction payloads
- **Server Members** — for `DiscordMemberJoined` / `DiscordMemberLeft`

A login with a token whose intents are not enabled is rejected by Discord.

## How the bot tokens are used

`src/client.ts` keeps one gateway connection per bot token. A token used by an
event flow stays connected for as long as the flow exists; a token that only a
runtime function used is disconnected again after 30 minutes of inactivity.

`src/eventBridge.ts` watches the flows Aquila streams to the action, connects the
bots they name, and fires every flow whose settings match an incoming Discord
event.

## ENV

| Variable | Description | Default |
|----------|-------------|---------|
| `ACTION_ID` | Identifier the action registers with. | `discord-action` |
| `VERSION` | Version reported to Aquila. | `1.0.0` |
| `AQUILA_URL` | Aquila address. | `127.0.0.1:8081` |
| `AUTH_TOKEN` | Token used to connect to Aquila. | — |

No Discord credentials are read from the environment.
