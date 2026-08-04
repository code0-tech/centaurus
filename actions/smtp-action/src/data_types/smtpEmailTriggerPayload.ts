import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const SmtpEmailReceivedPayloadSchema = z.object({
    from: z.string().describe("The sender address of the received email."),
    to: z.array(z.string()).describe("The recipient addresses of the received email."),
    subject: z.string().optional().describe("The subject line of the received email."),
    text: z.string().optional().describe("The plain-text body of the received email."),
    html: z.string().optional().describe("The HTML body of the received email."),
    messageId: z.string().optional().describe("The Message-ID of the received email."),
    date: z.string().optional().describe("The delivery date of the received email."),
});
export type SmtpEmailReceivedPayload = z.infer<typeof SmtpEmailReceivedPayloadSchema>;

export const SmtpEmailSentPayloadSchema = z.object({
    from: z.string().optional().describe("The sender address of the sent email."),
    to: z.array(z.string()).describe("The recipient addresses of the sent email."),
    subject: z.string().optional().describe("The subject line of the sent email."),
    text: z.string().optional().describe("The plain-text body of the sent email."),
    html: z.string().optional().describe("The HTML body of the sent email."),
    messageId: z.string().optional().describe("The Message-ID of the sent email."),
    status: z.string().optional().describe("The delivery status of the sent email."),
});
export type SmtpEmailSentPayload = z.infer<typeof SmtpEmailSentPayloadSchema>;

@Identifier("SMTP_EMAIL_RECEIVED_PAYLOAD")
@Name({ code: "en-US", content: "SMTP email received payload" })
@DisplayMessage({ code: "en-US", content: "SMTP email received payload" })
@Schema(SmtpEmailReceivedPayloadSchema)
export class SmtpEmailReceivedPayloadDataType {}

@Identifier("SMTP_EMAIL_SENT_PAYLOAD")
@Name({ code: "en-US", content: "SMTP email sent payload" })
@DisplayMessage({ code: "en-US", content: "SMTP email sent payload" })
@Schema(SmtpEmailSentPayloadSchema)
export class SmtpEmailSentPayloadDataType {}
