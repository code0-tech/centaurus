# SMTP Action

Send emails through any SMTP server from a Hercules flow. Built on
[nodemailer](https://nodemailer.com/), the de-facto standard SMTP client for
Node.js.

This action is function-only (like the GLS and Twilio actions) — it exposes
functions to send mail and build attachments, and does not register any
triggers.

## Configuration

Configured via the action's `ConfigurationDefinition`s:

| Identifier | Type | Required | Description |
|---|---|---|---|
| `host` | TEXT | yes | Hostname of the SMTP server, e.g. `smtp.example.com`. |
| `port` | TEXT | no (default `587`) | SMTP port. Common values: `587` (STARTTLS), `465` (implicit TLS). |
| `secure` | TEXT | no (default `false`) | `"true"` to use implicit TLS (port 465), `"false"` for STARTTLS (port 587). |
| `username` | TEXT | no | Username for SMTP AUTH. Leave empty for unauthenticated relays. |
| `password` | TEXT | no | Password for SMTP AUTH. |
| `from_address` | TEXT | no | Default `From` used when a function call omits it, e.g. `Acme <no-reply@example.com>`. |

Beyond the shared Hercules variables (`HERCULES_AUTH_TOKEN`,
`HERCULES_AQUILA_URL`, `HERCULES_ACTION_ID`, `HERCULES_SDK_VERSION`), no
provider-specific environment variables are required — SMTP credentials are
supplied through the configuration above.

## Functions

| Identifier | Signature | Description |
|---|---|---|
| `sendEmail` | `(To, Subject, Text, Html?, From?, Cc?, Bcc?, ReplyTo?): SMTP_SEND_RESULT` | Send a plain-text (and optionally HTML) email. `To`/`Cc`/`Bcc` are comma-separated address lists. |
| `sendEmailWithAttachments` | `(To, Subject, Text, Attachments, Html?, From?, Cc?, Bcc?): SMTP_SEND_RESULT` | Send an email with one or more attachments built via `createAttachment`. |
| `createAttachment` | `(Filename, Content, ContentType?, Encoding?): SMTP_ATTACHMENT` | Build an attachment object. Use `base64` encoding for binary files. |

## Data types

- `SMTP_SEND_RESULT` — normalized nodemailer `SentMessageInfo`: `messageId`,
  `accepted`, `rejected`, `response`, `envelope`.
- `SMTP_ENVELOPE` — the SMTP envelope (`from`, `to`) used for delivery.
- `SMTP_ATTACHMENT` — `filename`, `content`, optional `contentType` and
  `encoding`.

## Provider setup

Most providers (Gmail, Microsoft 365, Amazon SES, Postmark, Mailgun, etc.)
expose SMTP credentials. For Gmail/Workspace you typically need an
[App Password](https://support.google.com/accounts/answer/185833) rather than
your account password. Point `host`/`port` at the provider's SMTP endpoint and
set `secure` to match the port (465 → `true`, 587 → `false`).

## Development

```bash
cd actions/smtp-action
npm install
npm run typecheck
npm run build
npm run test
```
