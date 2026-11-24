# Slack Action

Slack integration for the **Hercules** automation platform — the canonical
"notify a human / capture a human decision" step in a flow.

Messages, threads, reactions, files and channel/user operations go out through
the Slack Web API; inbound Slack events arrive over
[Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode), so the
action needs no public URL.

## Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `slackPostMessage` | `(channelId: TEXT, text: TEXT, blocks?: LIST<SLACK_BLOCK>): SLACK_MESSAGE` | Post a message to a channel, private group or DM. |
| `slackReplyInThread` | `(channelId: TEXT, threadTs: TEXT, text: TEXT, blocks?: LIST<SLACK_BLOCK>): SLACK_MESSAGE` | Reply in an existing thread. |
| `slackUpdateMessage` | `(channelId: TEXT, ts: TEXT, text: TEXT, blocks?: LIST<SLACK_BLOCK>): SLACK_MESSAGE` | Replace the content of a message the app posted. |
| `slackDeleteMessage` | `(channelId: TEXT, ts: TEXT): BOOLEAN` | Delete a message the app posted. |
| `slackAddReaction` | `(channelId: TEXT, ts: TEXT, emoji: TEXT): BOOLEAN` | Add an emoji reaction to a message. |
| `slackSendDirectMessage` | `(userId: TEXT, text: TEXT, blocks?: LIST<SLACK_BLOCK>): SLACK_MESSAGE` | Open (or reuse) an IM channel with a user, then post into it. |
| `slackUploadFile` | `(channelId: TEXT, file: FILE<TEXT>, title?: TEXT): SLACK_FILE` | Upload a file and share it into a channel. |
| `slackCreateChannel` | `(name: TEXT, isPrivate?: BOOLEAN): SLACK_CHANNEL` | Create a public or private channel. |
| `slackInviteToChannel` | `(channelId: TEXT, userIds: LIST<TEXT>): SLACK_CHANNEL` | Invite up to 1000 users to a channel. |
| `slackGetUserByEmail` | `(email: TEXT): SLACK_USER` | Look a workspace member up by email address. |
| `slackSetChannelTopic` | `(channelId: TEXT, topic: TEXT): SLACK_CHANNEL` | Set a channel's topic. |

### Block Kit utils

Two builders assemble [Block Kit](https://docs.slack.dev/block-kit/) payloads for
the `blocks` argument of the message functions, mirroring the `create*` utils of
the `gls-action`:

| Function | Signature | Description |
|----------|-----------|-------------|
| `slackCreateTextSection` | `(text: TEXT, markdown?: BOOLEAN, blockId?: TEXT): SLACK_BLOCK` | A `section` block holding one text object. Slack markdown by default. |
| `slackCreateBlock` | `(type: "section" \| "header" \| "divider" \| "image" \| "context", text?: TEXT, fields?: LIST<TEXT>, imageUrl?: TEXT, altText?: TEXT, blockId?: TEXT): SLACK_BLOCK` | Any other block type — `divider`, `header`, `image`, `context`, or a `section` with fields. |

Only the arguments a block type actually uses are sent, so `slackCreateBlock("divider")`
produces a bare divider. `header` text is rendered literally, because Slack
rejects a `mrkdwn` text object there.

## Events

The action receives Slack events over
[Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode): it opens
a WebSocket connection to Slack with the project's `app_token` and fires the
matching flows itself. There is no Request URL to expose, no URL verification
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

Every trigger except `SlackChannelCreated` has an optional **Channel ID** setting.
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
   `connections:write` scope and store it as the `app_token` config.
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
| `SLACK_MESSAGE` | A posted message. `ts` identifies it within its channel and doubles as a thread timestamp. |
| `SLACK_CHANNEL` | A conversation: public or private channel, DM or group DM. |
| `SLACK_USER` | A workspace member, including their profile. |
| `SLACK_FILE` | A file hosted by Slack. |
| `SLACK_REACTION` | An emoji reaction and the item it points at. |
| `SLACK_BLOCK` | A single Block Kit block. |

Points in time on `SLACK_CHANNEL` and `SLACK_FILE` (`created`, `topic.last_set`,
`purpose.last_set`, `timestamp`) are `DATE` values; Slack's Unix seconds are
converted when the Web API responds. The event payloads keep Slack's raw Unix
seconds (`event_time`, `channel.created`): they reach the flow exactly as Slack
sends them. Message timestamps (`ts`, `thread_ts`, `event_ts`) stay `TEXT`:
Slack uses them as message identifiers.

A message timestamp is Unix seconds with a dot before the last six digits, e.g.
`1712345678.123456`. Usually you take it from a previous step (the `ts` of a
`SLACK_MESSAGE` or of an event payload). To use an existing message, copy its link
in Slack (`…/archives/C0123ABC/p1712345678123456`) and insert the dot before the
last six digits of the `p…` part; without the dot Slack answers `message_not_found`.

Slack's block and element catalogue keeps growing, so `SLACK_BLOCK` types the
fields shared by the common blocks and leaves `accessory` and `elements` open for
raw Block Kit objects.

The five event payload schemas live next to them; the four Events API ones share
the envelope built by `src/data_types/slackEventEnvelope.ts`.

## Configuration

| Config | Required | Env default | Description |
|--------|----------|-------------|-------------|
| `bot_token` | yes | `SLACK_BOT_TOKEN` | Bot user OAuth token (`xoxb-…`), the Bearer credential for the Web API. Found under *OAuth & Permissions*. |
| `app_token` | for triggers | `SLACK_APP_TOKEN` | App-level token (`xapp-…`) with the `connections:write` scope. Needed only for the Slack triggers, which arrive over Socket Mode. Found under *Basic Information → App-Level Tokens*. |

Beyond these the action uses the shared Hercules variables (`HERCULES_AUTH_TOKEN`,
`HERCULES_AQUILA_URL`, `HERCULES_ACTION_ID`, `HERCULES_SDK_VERSION`) documented in
the [repository README](../../README.md).

### Slack app scopes

The bot token needs the scopes for the functions and events a flow actually uses:

| Scope | Used by |
|-------|---------|
| `chat:write` | `slackPostMessage`, `slackReplyInThread`, `slackUpdateMessage`, `slackDeleteMessage`, `slackSendDirectMessage` |
| `reactions:write` | `slackAddReaction` |
| `files:write` | `slackUploadFile` |
| `channels:manage`, `groups:write` | `slackCreateChannel`, `slackInviteToChannel`, `slackSetChannelTopic` |
| `im:write` | `slackSendDirectMessage` |
| `users:read`, `users:read.email` | `slackGetUserByEmail` |
| `channels:history`, `app_mentions:read`, `reactions:read`, `channels:read` | the corresponding events |

All API calls go through the official
[`@slack/web-api`](https://www.npmjs.com/package/@slack/web-api) SDK, which
handles authentication, retries and rate limit backoff.
