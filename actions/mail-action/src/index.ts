import "reflect-metadata";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";

import { MailSendResultDataType } from "./data_types/mailSendResult.js";
import { ReceivedMailDataType } from "./data_types/receivedMail.js";
import { SendEmailFunction } from "./functions/sendEmailFunction.js";
import { SendEmailWithAttachmentsFunction } from "./functions/sendEmailWithAttachmentsFunction.js";
import { MailReceivedEvent } from "./events/mailReceived.js";
import { startMailListener } from "./imapListener.js";

const action = new Action(
    process.env.ACTION_ID ?? "mail-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "tabler:mail",
    "Mail integration: send transactional and notification emails (with attachments) through any SMTP server via nodemailer, and trigger flows on mail received through an IMAP mailbox.",
    [{ code: "en-US", content: "Email" }],
    [
        {
            identifier: "host",
            type: "TEXT",
            name: [{ code: "en-US", content: "SMTP host" }],
            description: [{ code: "en-US", content: "The hostname of the SMTP server, e.g. smtp.example.com." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "port",
            type: "TEXT",
            defaultValue: "587",
            name: [{ code: "en-US", content: "SMTP port" }],
            description: [{ code: "en-US", content: "The port of the SMTP server. Common values are 587 (STARTTLS) and 465 (implicit TLS)." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "secure",
            type: "TEXT",
            defaultValue: "false",
            name: [{ code: "en-US", content: "Use implicit TLS" }],
            description: [{ code: "en-US", content: "Set to \"true\" to connect using implicit TLS (typically port 465). Use \"false\" for STARTTLS on port 587." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "username",
            type: "TEXT",
            defaultValue: "",
            name: [{ code: "en-US", content: "Username" }],
            description: [{ code: "en-US", content: "The username used to authenticate with the SMTP server. Leave empty for unauthenticated servers." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "password",
            type: "TEXT",
            defaultValue: "",
            name: [{ code: "en-US", content: "Password" }],
            description: [{ code: "en-US", content: "The password used to authenticate with the SMTP server." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "from_address",
            type: "TEXT",
            defaultValue: "",
            name: [{ code: "en-US", content: "Default sender" }],
            description: [{ code: "en-US", content: "The default From address used when an email does not specify a From value, e.g. \"Acme <no-reply@example.com>\"." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "imap_host",
            type: "TEXT",
            name: [{ code: "en-US", content: "IMAP host" }],
            description: [{ code: "en-US", content: "The hostname of the IMAP server to watch for incoming mail, e.g. imap.example.com." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "imap_port",
            type: "TEXT",
            defaultValue: "993",
            name: [{ code: "en-US", content: "IMAP port" }],
            description: [{ code: "en-US", content: "The port of the IMAP server. Defaults to 993 (implicit TLS)." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "imap_secure",
            type: "TEXT",
            defaultValue: "true",
            name: [{ code: "en-US", content: "Use implicit TLS" }],
            description: [{ code: "en-US", content: "Set to \"true\" to connect using implicit TLS (typically port 993). Use \"false\" for an unencrypted or STARTTLS connection." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "imap_username",
            type: "TEXT",
            defaultValue: "",
            name: [{ code: "en-US", content: "IMAP username" }],
            description: [{ code: "en-US", content: "The username used to authenticate with the IMAP server." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "imap_password",
            type: "TEXT",
            defaultValue: "",
            name: [{ code: "en-US", content: "IMAP password" }],
            description: [{ code: "en-US", content: "The password used to authenticate with the IMAP server." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "imap_mailbox",
            type: "TEXT",
            defaultValue: "INBOX",
            name: [{ code: "en-US", content: "Mailbox" }],
            description: [{ code: "en-US", content: "The mailbox folder to watch for incoming mail." }],
            linkedDataTypes: ["TEXT"],
        },
    ]
);

action.registerDataTypeClass(MailSendResultDataType);
action.registerDataTypeClass(ReceivedMailDataType);

action.registerRuntimeFunction(SendEmailFunction);
action.registerRuntimeFunction(SendEmailWithAttachmentsFunction);

action.registerRuntimeEventClass(MailReceivedEvent);

action.on(CodeZeroEvent.connected, () => {
    console.log("Connected to aquila");
    startMailListener(action);
});

action.on(CodeZeroEvent.error, (error: Error) => {
    console.error("Stream error:", error.message);
    console.log("Attempting to reconnect in 5s...");
    setTimeout(() => {
        action.connect(process.env.AUTH_TOKEN ?? "mail-action").catch((err: Error) => {
            action.emit(CodeZeroEvent.error, err);
        });
    }, 5000);
});

action.connect(process.env.AUTH_TOKEN ?? "mail-action").catch((err: Error) => {
    action.emit(CodeZeroEvent.error, err);
});

action.on(CodeZeroEvent.moduleUpdated, (message: any) => {
    console.dir(message, { depth: null });
    console.dir(action.configs.values(), { depth: null });
});

export { action };
