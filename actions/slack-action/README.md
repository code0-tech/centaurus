# Slack Action

Slack integration for the **Hercules** automation platform — the canonical
"notify a human / capture a human decision" step in a flow.

Messages, threads, reactions, files and channel/user operations go out through
the Slack Web API; inbound Slack events arrive over
[Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode), so the
action needs no public URL.

## Credentials

The action holds no credentials of its own. Every function and every trigger
takes the token it works with as its first parameter, so one running action
serves as many Slack apps as its flows use. Functions and triggers need
different tokens, so each has its own token type (a single text value):

| Data type | Parameter | Used by | Description |
|-----------|-----------|---------|-------------|
| `SLACK_BOT_TOKEN` | `botToken` | every function | Bot user OAuth token (`xoxb-…`), the Bearer credential for the Web API. Found under *OAuth & Permissions*. |
| `SLACK_APP_TOKEN` | `appToken` | every trigger | App-level token (`xapp-…`) with the `connections:write` scope; the triggers receive events over Socket Mode with it. Found under *Basic Information → App-Level Tokens*. |

## Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `slackPostMessage` | `(botToken: SLACK_BOT_TOKEN, channelId: TEXT, text?: TEXT, embed?: SLACK_EMBED): SLACK_MESSAGE` | Post a message to a channel, private group or DM. |
| `slackReplyInThread` | `(botToken: SLACK_BOT_TOKEN, channelId: TEXT, threadTs: DATE, text?: TEXT, embed?: SLACK_EMBED): SLACK_MESSAGE` | Reply in an existing thread. |
| `slackUpdateMessage` | `(botToken: SLACK_BOT_TOKEN, channelId: TEXT, ts: DATE, text?: TEXT, embed?: SLACK_EMBED): SLACK_MESSAGE` | Replace the content of a message the app posted. |
| `slackDeleteMessage` | `(botToken: SLACK_BOT_TOKEN, channelId: TEXT, ts: DATE): BOOLEAN` | Delete a message the app posted. |
| `slackAddReaction` | `(botToken: SLACK_BOT_TOKEN, channelId: TEXT, ts: DATE, emoji: TEXT): BOOLEAN` | Add an emoji reaction to a message. |
| `slackSendDirectMessage` | `(botToken: SLACK_BOT_TOKEN, user: TEXT, text?: TEXT, embed?: SLACK_EMBED): SLACK_MESSAGE` | Open (or reuse) an IM channel with a user, then post into it. |
| `slackUploadFile` | `(botToken: SLACK_BOT_TOKEN, channelId: TEXT, file: FILE<TEXT>, title?: TEXT): SLACK_FILE` | Upload a file and share it into a channel. |
| `slackCreateChannel` | `(botToken: SLACK_BOT_TOKEN, name: TEXT, isPrivate?: BOOLEAN): SLACK_CHANNEL` | Create a public or private channel. |
| `slackInviteToChannel` | `(botToken: SLACK_BOT_TOKEN, channelId: TEXT, users: LIST<TEXT>): SLACK_CHANNEL` | Invite up to 1000 users to a channel. |
| `slackGetUserByEmail` | `(botToken: SLACK_BOT_TOKEN, email: TEXT): SLACK_USER` | Look a workspace member up by email address. |
| `slackSetChannelTopic` | `(botToken: SLACK_BOT_TOKEN, channelId: TEXT, topic: TEXT): SLACK_CHANNEL` | Set a channel's topic. |

### Embeds

A message takes a `text`, an `embed` or both. The `SLACK_EMBED` is a rich card
filled in like a form, so nobody has to know Block Kit:

| Field | Rendered as |
|-------|-------------|
| `title` | A bold heading (`header` block, max 150 characters). |
| `text` | The main text, Slack markdown (`section` block). |
| `fields` | A list of `SLACK_EMBED_FIELD` (`name`, `value`) shown in two columns (`section` fields, 10 per section). |
| `thumbnailUrl` | A small image next to the text (section `accessory`). |
| `imageUrl` | A large image below the text (`image` block). |
| `footer` | Small grey text at the bottom (`context` block). |

Every part is optional; unset parts are left out. Without a `text`, the embed's
title (or text) is used as the notification text.

### Users

`slackSendDirectMessage` and `slackInviteToChannel` accept each user as an email
address (looked up via `users.lookupByEmail`, needs `users:read.email`), a user ID
(`U0123456789`) or a mention as it appears in message text (`<@U0123456789>`).
Slack has no API to look a user up by display name, and display names are not
unique, so names are not accepted.

## Events

The action receives Slack events over
[Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode): it opens
one WebSocket connection to Slack per `appToken` the trigger flows use (from their
`appToken` setting) and fires the matching flows itself. There is no Request URL to expose, no URL verification
challenge to answer and no request signature to check, because the connection is
authenticated by the app token. Every delivery is acknowledged right away, so
long running flows do not cause Slack to redeliver it.

| Trigger | Slack event | Payload |
|---------|-------------|---------|
| `SlackMessagePosted` | `message.channels` (also `message.groups`, `message.im`, `message.mpim` if subscribed) | `SlackMessagePostedEventPayload` |
| `SlackAppMentioned` | `app_mention` | `SlackAppMentionEventPayload` |
| `SlackReactionAdded` | `reaction_added` | `SlackReactionAddedEventPayload` |
| `SlackChannelCreated` | `channel_created` | `SlackChannelCreatedEventPayload` |
| `SlackSlashCommand` | slash command invocation | `SlackSlashCommandPayload` |

The four Events API triggers receive Slack's `event_callback` envelope
(`{ team_id, event_id, event: { … } }`); a slash command receives its flat fields
without an envelope.

`SlackMessagePosted` skips edits, deletions and join notices (messages with a
`subtype`) and messages sent by bots, including this app. Otherwise a flow that
posts into the channel it listens to would trigger itself again.

### Filtering by channel

Every trigger takes the **Slack app token** to listen with. Every trigger except `SlackChannelCreated` also has an optional
**Channel ID** setting.
Leave it empty to trigger for every channel the app is in, or set it to a channel
ID (e.g. `C0123456789`) to trigger only for that channel.

`SlackReactionAdded` also has an optional **Message** setting to trigger only for
reactions to one message, e.g. an approval request. Paste the message link from
Slack (*Copy link*) or enter its timestamp (`1712345678.123456`); the link is
converted to the timestamp.

### Replying to slash commands

The command is acknowledged immediately without a visible reply. Reply from the
flow with `slackPostMessage` into `channel_id`, or post to the payload's
`response_url` for up to 30 minutes afterwards.

### Setting up the Slack app

1. **Socket Mode**: enable it under *Settings → Socket Mode*.
2. **App token**: create one under *Basic Information → App-Level Tokens* with the
   `connections:write` scope and set it as the **Slack app token** of the triggers.
3. **Events**: under *Event Subscriptions*, enable events and subscribe to the bot
   events you use (`message.channels`, `app_mention`, `reaction_added`,
   `channel_created`). With Socket Mode enabled no Request URL is asked for.
4. **Slash commands**: create them under *Slash Commands*; no Request URL is
   needed either.
5. Reinstall the app to the workspace after changing scopes or events.

## Data types

One class per file in `src/data_types/`, each a hand-written `zod` schema
registered with `@Identifier` / `@Name` / `@Schema`:

| Data type | Description |
|-----------|-------------|
| `SLACK_MESSAGE` | A posted message. `ts` identifies it within its channel and doubles as the thread to reply in. |
| `SLACK_CHANNEL` | A conversation: public or private channel, DM or group DM. |
| `SLACK_USER` | A workspace member, including their profile. |
| `SLACK_FILE` | A file hosted by Slack. |
| `SLACK_REACTION` | An emoji reaction and the item it points at. |
| `SLACK_BOT_TOKEN` | The bot token the functions call the Web API with. |
| `SLACK_APP_TOKEN` | The app token the triggers receive events with. |
| `SLACK_EMBED` | A rich message body: title, text, fields, images and footer. |
| `SLACK_EMBED_FIELD` | One label/value pair of an embed. |

All points in time are `DATE` values (Unix microseconds): the `created` and
`last_set` fields of `SLACK_CHANNEL` and `SLACK_FILE`, and the message timestamps
`ts`, `thread_ts` and `event_ts` of `SLACK_MESSAGE`, `SLACK_REACTION` and the event
payloads (as well as `event_time` and `channel.created`).

Slack identifies a message by its timestamp (`1712345678.123456`, Unix seconds
with six decimals). That is exactly a point in time in microseconds, so the
conversion to `DATE` is lossless: pass the `ts` of a `SLACK_MESSAGE` or of a
trigger payload straight into the `ts` / `threadTs` parameter of the next step.

The five event payload schemas live next to them; the four Events API ones share
the envelope built by `src/data_types/slackEventEnvelope.ts`.

## Configuration

The action has no module configuration; the Slack tokens are passed per flow as
`SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN` (see [Credentials](#credentials)). It uses the shared Hercules
variables (`HERCULES_AUTH_TOKEN`, `HERCULES_AQUILA_URL`, `HERCULES_ACTION_ID`,
`HERCULES_SDK_VERSION`) documented in the [repository README](../../README.md).

### Slack app scopes

The bot token needs the scopes for the functions and events a flow actually uses:

| Scope | Used by |
|-------|---------|
| `chat:write` | `slackPostMessage`, `slackReplyInThread`, `slackUpdateMessage`, `slackDeleteMessage`, `slackSendDirectMessage` |
| `reactions:write` | `slackAddReaction` |
| `files:write` | `slackUploadFile` |
| `channels:manage`, `groups:write` | `slackCreateChannel`, `slackInviteToChannel`, `slackSetChannelTopic` |
| `im:write` | `slackSendDirectMessage` |
| `users:read`, `users:read.email` | `slackGetUserByEmail`, and email addresses in `slackSendDirectMessage` / `slackInviteToChannel` |
| `channels:history`, `app_mentions:read`, `reactions:read`, `channels:read` | the corresponding events |

All API calls go through the official
[`@slack/web-api`](https://www.npmjs.com/package/@slack/web-api) SDK, which
handles authentication, retries and rate limit backoff.
