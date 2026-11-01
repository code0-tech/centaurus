import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * RECEIVED_MAIL is a normalized view of an incoming message parsed with
 * mailparser's `simpleParser` (see https://nodemailer.com/extras/mailparser/).
 * It is the payload passed to flows triggered by the MAIL_RECEIVED event.
 */

export const ReceivedMailSchema = z.object({
    messageId: z.string().describe("The Message-ID header of the received message."),
    from: z.string().describe("The sender address."),
    to: z.array(z.string()).describe("The recipient (To) addresses."),
    cc: z.array(z.string()).describe("The carbon-copy (Cc) addresses."),
    subject: z.string().describe("The subject line of the message."),
    text: z.string().describe("The plain-text body of the message."),
    html: z.string().describe("The HTML body of the message, empty string when none."),
    date: z.string().describe("The message date as an ISO 8601 string, empty string when missing."),
});
export type ReceivedMail = z.infer<typeof ReceivedMailSchema>;

@Identifier("RECEIVED_MAIL")
@Name({ code: "en-US", content: "Received mail" })
@DisplayMessage({ code: "en-US", content: "Received mail" })
@Schema(ReceivedMailSchema)
export class ReceivedMailDataType {}
