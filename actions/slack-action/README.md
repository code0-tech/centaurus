# Slack Action

Slack integration for the **Hercules** automation platform — the canonical
"notify a human / capture a human decision" step in a flow.

Messages, threads, reactions, files and channel/user operations go out through
the Slack Web API; inbound Slack events arrive as `Rest` webhook flow types, the
same pattern the `shopify-action` and `stripe-action` use.

## Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `slackPostMessage` | `(channelId: TEXT, text: TEXT, blocks?: LIST<SLACK_BLOCK>): SLACK_MESSAGE` | Post a message to a channel, private group or DM. |
| `slackReplyInThread` | `(channelId: TEXT, threadTs: TEXT, text: TEXT, blocks?: LIST<SLACK_BLOCK>): SLACK_MESSAGE` | Reply in an existing thread. |
| `slackUpdateMessage` | `(channelId: TEXT, ts: TEXT, text: TEXT, blocks?: LIST<SLACK_BLOCK>): SLACK_MESSAGE` | Replace the content of a message the app posted. |
| `slackDeleteMessage` | `(channelId: TEXT, ts: TEXT): BOOLEAN` | Delete a message the app posted. |
| `slackAddReaction` | `(channelId: TEXT, ts: TEXT, emoji: TEXT): BOOLEAN` | Add an emoji reaction to a message. |
| `slackSendDirectMessage` | `(userId: TEXT, text: TEXT, blocks?: LIST<SLACK_BLOCK>): SLACK_MESSAGE` | Open (or reuse) an IM channel with a user, then post into it. |
| `slackUploadFile` | `(channelId: TEXT, filename: TEXT, content: TEXT, title?: TEXT): SLACK_FILE` | Upload a text file and share it into a channel. |
| `slackCreateChannel` | `(name: TEXT, isPrivate?: BOOLEAN): SLACK_CHANNEL` | Create a public or private channel. |
| `slackInviteToChannel` | `(channelId: TEXT, userIds: LIST<TEXT>): SLACK_CHANNEL` | Invite up to 1000 users to a channel. |
| `slackGetUserByEmail` | `(email: TEXT): SLACK_USER` | Look a workspace member up by email address. |
| `slackSetChannelTopic` | `(channelId: TEXT, topic: TEXT): SLACK_CHANNEL` | Set a channel's topic. |
| `slackVerifyRequestSignature` | `(signature: TEXT, timestamp: TEXT, rawBody: TEXT): BOOLEAN` | Verify that an inbound request really came from Slack. See [Verifying inbound requests](#verifying-inbound-requests). |

### Block Kit utils

Two builders assemble [Block Kit](https://docs.slack.dev/block-kit/) payloads for
the `blocks` argument of the message functions, mirroring the `create*` utils of
the `gls-action`:

| Function | Signature | Description |
|----------|-----------|-------------|
| `slackCreateTextSection` | `(text: TEXT, markdown?: BOOLEAN, blockId?: TEXT): SLACK_BLOCK` | A `section` block holding one text object. Slack markdown by default. |
| `slackCreateBlock` | `(type: TEXT, text?: TEXT, fields?: LIST<TEXT>, imageUrl?: TEXT, altText?: TEXT, blockId?: TEXT): SLACK_BLOCK` | Any other block type — `divider`, `header`, `image`, `context`, or a `section` with fields. |

Only the arguments a block type actually uses are sent, so `slackCreateBlock("divider")`
produces a bare divider. `header` text is rendered literally, because Slack
rejects a `mrkdwn` text object there.

## Events

Slack pushes events over HTTP via its [Events API](https://docs.slack.dev/apis/events-api).
Each event below is a `Rest` flow type: it exposes an HTTP endpoint, so paste its
URL into **Event Subscriptions → Request URL** in your Slack app and subscribe to
the matching bot event.

| Event | Slack event | Payload |
|-------|-------------|---------|
| `SlackMessagePosted` | `message.channels` | `SlackMessagePostedEventPayload` |
| `SlackAppMentioned` | `app_mention` | `SlackAppMentionEventPayload` |
| `SlackReactionAdded` | `reaction_added` | `SlackReactionAddedEventPayload` |
| `SlackChannelCreated` | `channel_created` | `SlackChannelCreatedEventPayload` |
| `SlackSlashCommand` | slash command invocation | `SlackSlashCommandPayload` |

The four Events API events arrive as `application/json`, wrapped in the shared
`event_callback` envelope (`{ team_id, event_id, event: { … } }`); a slash command
arrives as `application/x-www-form-urlencoded` with flat fields and no envelope.
Both defaults are pre-set on the events, together with `POST`.

### Filtering by channel or command

Slack delivers one subscription to one Request URL, so an endpoint receives every
message of every channel the app is in — the event itself cannot narrow that
down. Filter inside the flow instead: compare `event.channel`
(`SlackMessagePosted`), `event.item.channel` (`SlackReactionAdded`) or `command`
(`SlackSlashCommand`) against the value you care about and stop early otherwise.

### Responding to Slack

Slack expects a `2xx` within three seconds and retries otherwise, so respond with
the `Respond` function of the `rest-action` (`rest::control::respond`) before doing
slow work:

- **URL verification** — when you first save the Request URL, Slack posts
  `{ "type": "url_verification", "challenge": "…" }` and expects the `challenge`
  echoed back.
- **Slash commands** — respond with a body to reply immediately, or respond empty
  and post to the payload's `response_url` for up to 30 minutes afterwards.

### Verifying inbound requests

Slack signs each request with an `X-Slack-Signature` header: an HMAC-SHA256 over
`v0:<X-Slack-Request-Timestamp>:<raw body>` keyed with the signing secret.
`slackVerifyRequestSignature` recomputes it and additionally rejects timestamps
older than five minutes as replays.

> **Known limitation:** Slack signs the exact bytes it sent, and the `Rest` flow
> type hands the flow an already parsed `payload` — re-serializing it does not
> reproduce those bytes. Until the REST adapter exposes the raw body, the function
> can only be used where the flow has the unparsed body available. Slack does not
> send a Bearer token either, so the event's `http_auth` setting cannot stand in
> for it. Treat these endpoints as publicly reachable and keep that in mind for
> what a flow does with an unverified payload.

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

Slack's block and element catalogue keeps growing, so `SLACK_BLOCK` types the
fields shared by the common blocks and leaves `accessory` and `elements` open for
raw Block Kit objects.

The five event payload schemas live next to them; the four Events API ones share
the envelope built by `src/data_types/slackEventEnvelope.ts`.

## Configuration

| Config | Required | Env default | Description |
|--------|----------|-------------|-------------|
| `bot_token` | yes | `SLACK_BOT_TOKEN` | Bot user OAuth token (`xoxb-…`), the Bearer credential for the Web API. Found under *OAuth & Permissions*. |
| `signing_secret` | yes | `SLACK_SIGNING_SECRET` | Signing secret used by `slackVerifyRequestSignature`. Found under *Basic Information*. |
| `app_token` | no | `SLACK_APP_TOKEN` | App-level token (`xapp-…`), only needed when running the Slack app in Socket Mode instead of exposing public HTTP endpoints. |

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
