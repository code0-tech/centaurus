# Telegram Action

Telegram bot integration for the **Hercules** automation platform, built on the
[Telegram Bot API](https://core.telegram.org/bots/api).

The action holds no credentials of its own: **every runtime function takes the
bot token it works with as its first parameter, and every event takes its bot
token and webhook secret as settings**. One running action serves as many
Telegram bots as its flows use, and there is nothing to configure on the module.
Only events receive updates over a webhook, so only events have a webhook
secret.

## Bot setup

1. Talk to [@BotFather](https://t.me/BotFather), send `/newbot` and follow the
   steps. BotFather answers with the bot token (`123456789:AA...`).
2. To let the bot read every message in a group (not only commands and
   replies to it), turn off its privacy mode with `/setprivacy` in BotFather.
3. Use `telegramGetMe(botToken)` to check that the token works.

## Functions

| Function | Description |
|----------|-------------|
| `telegramSendMessage` | Send a text message, optionally formatted, with an inline keyboard, or as a reply. |
| `telegramSendPhoto` | Send a photo by HTTP URL or file id. |
| `telegramSendDocument` | Send a file by HTTP URL or file id. |
| `telegramEditMessageText` | Replace the text (and keyboard) of a message the bot sent. |
| `telegramDeleteMessage` | Delete a message. |
| `telegramAnswerCallbackQuery` | Answer the press of an inline keyboard button. |
| `telegramGetChat` | Read a chat. |
| `telegramGetMe` | Read the bot behind a token. It doubles as a credential check. |

Each one starts with the `botToken` parameter, followed by what the Bot API
method needs, for example `telegramSendMessage(botToken, chatId, text, parseMode?, inlineKeyboard?, replyToMessageId?)`.

- `chatId` is the chat's id as a string (the events deliver it that way), or
  `@channelusername` for a public channel.
- `parseMode` is `MarkdownV2` or `HTML`. Empty sends plain text.
- `inlineKeyboard` is a list of rows of `TELEGRAM_INLINE_KEYBOARD_BUTTON`. Each
  button has a `text` and exactly one of `callbackData` (at most 64 bytes;
  pressing the button fires `TelegramCallbackQuery`) or `url`.
- Photos and documents are sent by URL or file id only. Uploading binary
  content is left out until file handling (taurus-file/S3) is settled.

## Events

| Event | Fires when | Settings |
|-------|------------|----------|
| `TelegramMessageReceived` | The bot receives a new message. | `botToken`, `webhookSecret?`, `chatId?` |
| `TelegramCallbackQuery` | A user presses an inline keyboard button with callback data. | `botToken`, `webhookSecret?`, `chatId?`, `data?` |

An optional filter setting that is left empty is a wildcard.
`TelegramMessageReceived` without a chat id reacts to messages in every chat of
the bot.

A flow started by `TelegramCallbackQuery` should call
`telegramAnswerCallbackQuery` with the query's `id`. Until then, Telegram shows a
loading indicator on the button.

### Webhook

Telegram pushes updates to a webhook. The action runs the webhook server itself
and manages the webhooks:

- Whenever the event flows change, the action calls `setWebhook` for every bot
  that a flow listens with. The URL is `TELEGRAM_WEBHOOK_URL` followed by
  `/telegram/<id>`, where the id is derived from the token and does not reveal
  it. Only `message` and `callback_query` updates are requested.
- When the last flow of a bot is deleted, its webhook is removed again. Only
  webhooks this process registered are removed.
- Every update has to carry the bot's secret in the
  `X-Telegram-Bot-Api-Secret-Token` header. Updates without it are answered
  with `401` and start no flow.

The secret is the flow's `webhookSecret` setting: 1-256 characters of `A-Z`,
`a-z`, `0-9`, `_` and `-`. If it is left empty, the action derives a secret
from the bot token, so the webhook is never unprotected. A bot has exactly one
webhook and therefore one secret. If flows of the same bot set different
secrets, the first one (by flow id) wins, and the flows that disagree are
skipped with a warning.

Telegram only delivers to HTTPS URLs on port 443, 80, 88 or 8443. Put the
webhook server behind a reverse proxy that terminates TLS. A path prefix in
`TELEGRAM_WEBHOOK_URL` is fine as long as the proxy forwards the
`/telegram/<id>` part.

> The webhook is served by this action rather than by `rest-action`. A
> `rest-action` event can only carry the `http_*` settings of a REST route, so
> it has no place for the bot token and secret. `rest-action` also only
> authenticates the `Authorization` header, not Telegram's secret header.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_WEBHOOK_URL` | Public base URL Telegram reaches the webhook server under, e.g. `https://bots.example.com`. Without it, no webhook is registered and events do not fire. | unset |
| `TELEGRAM_WEBHOOK_HOST` | Address the webhook server binds to. | `0.0.0.0` |
| `TELEGRAM_WEBHOOK_PORT` | Port the webhook server listens on. | `8080` |

## Errors

Bot API errors are raised as `RuntimeError`s: `TELEGRAM_BAD_REQUEST` (400),
`TELEGRAM_UNAUTHORIZED` (401), `TELEGRAM_FORBIDDEN` (403, e.g. the user blocked
the bot), `TELEGRAM_NOT_FOUND` (404, also returned for an invalid token) and
`TELEGRAM_RATE_LIMITED` (429). The 429 message includes Telegram's
`retry_after` in seconds. Telegram allows about 30 messages per second overall
and about 1 per second per chat.

## Example: echo bot

1. Create a flow with the `TelegramMessageReceived` event and your bot token.
2. Add `telegramSendMessage(botToken, message.chat.id, message.text, replyToMessageId: message.messageId)`.

Every message the bot receives is now answered with the same text.

## Development

```bash
npm ci
npm run typecheck
npm test
npm run build
```
