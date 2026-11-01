# Mail Action

Send and receive email from a Hercules flow. Sending is built on
[nodemailer](https://nodemailer.com/), the de-facto standard SMTP client for
Node.js. Receiving is built on [imapflow](https://imapflow.com/) (connection
and IDLE handling) and [mailparser](https://nodemailer.com/extras/mailparser/)
(message parsing).

This action exposes functions to send mail and build attachments (like the
GLS and Twilio actions), and registers a single trigger, `MAIL_RECEIVED`, that
fires a flow whenever new mail arrives on a watched IMAP mailbox.

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
| `imap_host` | TEXT | yes (for receiving) | Hostname of the IMAP server to watch for incoming mail, e.g. `imap.example.com`. |
| `imap_port` | TEXT | no (default `993`) | IMAP port. Defaults to `993` (implicit TLS). |
| `imap_secure` | TEXT | no (default `true`) | `"true"` to use implicit TLS (port 993), `"false"` for an unencrypted/STARTTLS connection. |
| `imap_username` | TEXT | no | Username for IMAP authentication. |
| `imap_password` | TEXT | no | Password for IMAP authentication. |
| `imap_mailbox` | TEXT | no (default `INBOX`) | The mailbox folder to watch for incoming mail. |

The IMAP side only connects for a project once that project has a flow using
the `MAIL_RECEIVED` trigger, so the SMTP-only config keys above remain
sufficient if you only ever send mail.

Beyond the shared Hercules variables (`HERCULES_AUTH_TOKEN`,
`HERCULES_AQUILA_URL`, `HERCULES_ACTION_ID`, `HERCULES_SDK_VERSION`), no
provider-specific environment variables are required — mail credentials are
supplied through the configuration above.

## Functions

| Identifier | Signature | Description |
|---|---|---|
| `sendEmail` | `(To, Subject, Text, Html?, From?, Cc?, Bcc?, ReplyTo?): MAIL_SEND_RESULT` | Send a plain-text (and optionally HTML) email. `To`/`Cc`/`Bcc` are comma-separated address lists. |
| `sendEmailWithAttachments` | `(To, Subject, Text, Attachments, Html?, From?, Cc?, Bcc?): MAIL_SEND_RESULT` | Send an email with one or more attachments built via `createAttachment`. |
| `createAttachment` | `(Filename, Content, ContentType?, Encoding?): SMTP_ATTACHMENT` | Build an attachment object. Use `base64` encoding for binary files. |

## Trigger

| Identifier | Signature | Description |
|---|---|---|
| `MAIL_RECEIVED` | `(addresses: TEXT[]): RECEIVED_MAIL` | Fires a flow when new mail arrives on the project's configured IMAP mailbox. |

The `addresses` flow setting is a list of email addresses. When it is
non-empty, only mail whose `To`/`Cc` recipients include one of those
addresses (matched case-insensitively) triggers the flow; when empty, every
incoming message triggers the flow.

The action watches one IMAP connection per project that has at least one
`MAIL_RECEIVED` flow, and reconciles connections (opening/closing them) as
flows are created, updated, or deleted.

## Data types

- `MAIL_SEND_RESULT` — normalized nodemailer `SentMessageInfo`: `messageId`,
  `accepted`, `rejected`, `response`, `from`, `to`.
- `RECEIVED_MAIL` — a parsed incoming message: `messageId`, `from`, `to`,
  `cc`, `subject`, `text`, `html`, `date`.
- `SMTP_ATTACHMENT` — `filename`, `content`, optional `contentType` and
  `encoding`.

## Provider setup

Most providers (Gmail, Microsoft 365, Amazon SES, Postmark, Mailgun, etc.)
expose both SMTP and IMAP credentials. For Gmail/Workspace you typically need
an [App Password](https://support.google.com/accounts/answer/185833) rather
than your account password. Point `host`/`port` (SMTP) and `imap_host`/
`imap_port` (IMAP) at the provider's endpoints and set `secure`/`imap_secure`
to match the port (465/993 → `true`, 587/143 → `false`).

## Development

```bash
cd actions/mail-action
npm install
npm run typecheck
npm run build
npm run test
```
