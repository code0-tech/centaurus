import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { sendEmail } from "../helpers.js";
import { SmtpSendResult } from "../data_types/smtpSendResult.js";

@Identifier("sendEmail")
@DisplayIcon("tabler:mail")
@Signature("(Recipients: string, Subject: string, Text: string, Html?: string, From?: string, CarbonCopy?: string, Bcc?: string, ReplyTo?: string): SMTP_SEND_RESULT")
@Name({ code: "en-US", content: "Send email" })
@DisplayMessage({ code: "en-US", content: "Send email to ${Recipients}" })
@Documentation({
    code: "en-US",
    content:
        "Sends an email through the configured SMTP server using nodemailer.\nProvide `Html` to send a rich body alongside the plain text, and `From` to override the action's default sender. `Recipients`, `CarbonCopy`, and `Bcc` accept comma-separated address lists.",
})
@Description({
    code: "en-US",
    content: "Sends an email through the configured SMTP server.",
})
@Parameter({
    runtimeName: "Recipients",
    name: [{ code: "en-US", content: "To" }],
    description: [{ code: "en-US", content: "Comma-separated list of recipient email addresses." }],
})
@Parameter({
    runtimeName: "Subject",
    name: [{ code: "en-US", content: "Subject" }],
    description: [{ code: "en-US", content: "The subject line of the email." }],
})
@Parameter({
    runtimeName: "Text",
    name: [{ code: "en-US", content: "Text body" }],
    description: [{ code: "en-US", content: "The plain-text body of the email." }],
})
@Parameter({
    runtimeName: "Html",
    name: [{ code: "en-US", content: "HTML body" }],
    description: [{ code: "en-US", content: "Optional HTML body. When set it is sent alongside the plain-text body." }],
    optional: true,
})
@Parameter({
    runtimeName: "From",
    name: [{ code: "en-US", content: "From" }],
    description: [{ code: "en-US", content: "The sender address. Falls back to the configured default sender when omitted." }],
    optional: true,
})
@Parameter({
    runtimeName: "CarbonCopy",
    name: [{ code: "en-US", content: "CC" }],
    description: [{ code: "en-US", content: "Comma-separated list of CC recipients." }],
    optional: true,
})
@Parameter({
    runtimeName: "Bcc",
    name: [{ code: "en-US", content: "BCC" }],
    description: [{ code: "en-US", content: "Comma-separated list of BCC recipients." }],
    optional: true,
})
@Parameter({
    runtimeName: "ReplyTo",
    name: [{ code: "en-US", content: "Reply-To" }],
    description: [{ code: "en-US", content: "The Reply-To address for the email." }],
    optional: true,
})
export class SendEmailFunction {
    async run(
        context: FunctionContext,
        Recipients: string,
        Subject: string,
        Text: string,
        Html?: string,
        From?: string,
        CarbonCopy?: string,
        Bcc?: string,
        ReplyTo?: string
    ): Promise<SmtpSendResult> {
        try {
            return await sendEmail({ To:Recipients, Subject, Text, Html, From, Cc: CarbonCopy, Bcc, ReplyTo }, context);
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            if (error instanceof Error) {
                throw new RuntimeError("ERROR_SENDING_EMAIL", error.message);
            }
            throw new RuntimeError("ERROR_SENDING_EMAIL", "An error occurred while sending the email.");
        }
    }
}
