import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * SMTP_SEND_RESULT is a normalized view of nodemailer's SentMessageInfo
 * (see https://nodemailer.com/usage/#sending-mail). It captures the message id
 * assigned by the SMTP server together with the accepted/rejected recipient
 * lists and the raw server response so flows can branch on delivery outcome.
 */
export const SmtpEnvelopeSchema = z.object({
    from: z.string().describe("The envelope MAIL FROM address, empty when not set."),
    to: z.array(z.string()).describe("The envelope RCPT TO addresses."),
});
export type SmtpEnvelope = z.infer<typeof SmtpEnvelopeSchema>;

export const SmtpSendResultSchema = z.object({
    messageId: z.string().describe("The Message-ID assigned to the sent message."),
    accepted: z.array(z.string()).describe("Recipient addresses the SMTP server accepted."),
    rejected: z.array(z.string()).describe("Recipient addresses the SMTP server rejected."),
    response: z.string().describe("The last SMTP response string from the server."),
    envelope: SmtpEnvelopeSchema.describe("The SMTP envelope actually used for delivery."),
});
export type SmtpSendResult = z.infer<typeof SmtpSendResultSchema>;

@Identifier("SMTP_ENVELOPE")
@Name({ code: "en-US", content: "Email envelope" })
@DisplayMessage({ code: "en-US", content: "Email envelope" })
@Schema(SmtpEnvelopeSchema)
export class SmtpEnvelopeDataType {}

@Identifier("SMTP_SEND_RESULT")
@Name({ code: "en-US", content: "Email send result" })
@DisplayMessage({ code: "en-US", content: "Email send result" })
@Schema(SmtpSendResultSchema)
export class SmtpSendResultDataType {}
