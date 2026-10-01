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
    File,
} from "@code0-tech/hercules";
import { sendEmail } from "../helpers.js";
import { SmtpSendResult } from "../data_types/smtpSendResult.js";

@Identifier("sendEmailWithAttachments")
@DisplayIcon("tabler:mail")
@Signature("(Recipients: string, Subject: string, Text: string, Attachments: FILE<string>[], Html?: string, From?: string, CarbonCopy?: string, Bcc?: string): SMTP_SEND_RESULT")
@Name({ code: "en-US", content: "Send email with attachments" })
@DisplayMessage({ code: "en-US", content: "Send email with attachments to ${Recipients}" })
@Documentation({
    code: "en-US",
    content:
        "Sends an email with one or more attachments through the configured SMTP server.\nBuild each attachment with the `createAttachment` function. `Recipients`, `CarbonCopy`, and `Bcc` accept comma-separated address lists.",
})
@Description({
    code: "en-US",
    content: "Sends an email with attachments through the configured SMTP server.",
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
    runtimeName: "Attachments",
    name: [{ code: "en-US", content: "Attachments" }],
    description: [{ code: "en-US", content: "One or more attachments built with the createAttachment function." }],
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
export class SendEmailWithAttachmentsFunction {
    async run(
        context: FunctionContext,
        Recipients: string,
        Subject: string,
        Text: string,
        Attachments:  File<string>[],
        Html?: string,
        From?: string,
        CarbonCopy?: string,
        Bcc?: string
    ): Promise<SmtpSendResult> {
        try {
            return await sendEmail(
                { To:Recipients, Subject, Text, Html, From, Cc:CarbonCopy, Bcc, Attachments: Attachments.map(file => ({
                    filename: file.fileName,
                    content: file.value,
                    contentType: file.contentType as string,
                    encoding: file.valueType
                })) ?? [] },
                context
            );
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
