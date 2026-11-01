import {
    Alias,
    Description,
    DisplayIcon,
    DisplayMessage,
    EventSetting,
    Identifier,
    Name,
    RuntimeEventRunnable,
    Signature,
} from "@code0-tech/hercules";

/**
 * The `MAIL_RECEIVED` flow trigger.
 *
 * Registering this RuntimeEvent is what lets users attach a flow to incoming
 * mail in the platform UI. The action itself watches the configured IMAP
 * mailbox (see `imapListener.ts`) and drives execution of matching flows via
 * `action.executeFlow`.
 */
@Identifier("MAIL_RECEIVED")
@DisplayIcon("tabler:mail-down")
@Signature("(addresses: TEXT[]): RECEIVED_MAIL")
@Name({ code: "en-US", content: "Mail received" })
@Description({
    code: "en-US",
    content: "Triggered when a new mail arrives on the configured IMAP server for one of the given recipient addresses.",
})
@DisplayMessage({ code: "en-US", content: "Mail received for ${addresses}" })
@Alias({ code: "en-US", content: "mail;email;imap;receive;inbox;trigger" })
@EventSetting({
    identifier: "addresses",
    name: [{ code: "en-US", content: "Mail addresses" }],
    description: [
        {
            code: "en-US",
            content: "Incoming mail whose recipient (To/Cc) matches one of these addresses triggers this flow. Leave empty to match all incoming mail.",
        },
    ],
    optional: true,
    linkedDataTypeIdentifiers: ["TEXT"],
})
export class MailReceivedEvent implements RuntimeEventRunnable {}
