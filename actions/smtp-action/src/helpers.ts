import { FunctionContext, RuntimeError, File } from "@code0-tech/hercules";
import nodemailer, { type Transporter } from "nodemailer";
import { SmtpSendResult, SmtpSendResultSchema } from "./data_types/smtpSendResult.js";

/**
 * Splits a comma-separated address string into a trimmed, non-empty array.
 */
function toAddressList(value: string | undefined): string[] {
    if (!value) return [];
    return value
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}

/**
 * Builds a nodemailer transport from the action configuration. Mirrors the
 * per-call client construction used by the twilio action; the transport itself
 * is cheap to create and pools connections internally.
 */
function getTransport(context: FunctionContext): Transporter {
    const host = context.matchedConfig.findConfig("host") as string;
    if (!host) {
        throw new RuntimeError(
            "MISSING_SMTP_HOST",
            "No SMTP host configured. Set the host config for this action."
        );
    }

    const portValue = context.matchedConfig.findConfig("port") as string | undefined;
    const port = portValue ? Number(portValue) : 587;
    if (Number.isNaN(port)) {
        throw new RuntimeError("INVALID_SMTP_PORT", `The configured SMTP port "${portValue}" is not a number.`);
    }

    const secure = String(context.matchedConfig.findConfig("secure") ?? "").toLowerCase() === "true";
    const user = context.matchedConfig.findConfig("username") as string | undefined;
    const pass = context.matchedConfig.findConfig("password") as string | undefined;

    return nodemailer.createTransport({
        host,
        port,
        secure,
        ...(user || pass ? { auth: { user: user ?? "", pass: pass ?? "" } } : {}),
    });
}

/**
 * Resolves the sender address, preferring an explicit From over the configured
 * default. Throws when neither is available.
 */
function resolveFrom(context: FunctionContext, from?: string): string {
    const resolved = from || ((context.matchedConfig.findConfig("from_address") as string) ?? "");
    if (!resolved) {
        throw new RuntimeError(
            "MISSING_SMTP_SENDER",
            "No sender provided. Pass a From value or configure a default from_address for the action."
        );
    }
    return resolved;
}

/**
 * nodemailer types accepted/rejected/envelope addresses as `string | Address`.
 * Normalize any of those shapes to a plain email string.
 */
function normalizeAddress(address: unknown): string {
    if (typeof address === "string") return address;
    if (address && typeof address === "object" && "address" in address) {
        return String((address as { address: unknown }).address ?? "");
    }
    return String(address ?? "");
}

/**
 * Sends an email through the configured SMTP server using nodemailer and maps
 * the result onto the SMTP_SEND_RESULT data type.
 */
export const sendEmail = async (
    data:{
        To: string,
        Subject: string,
        Text: string,
        Html?: string,
        From?: string,
        Cc?: string,
        Bcc?: string,
        Attachments?:  File<string>[],
        ReplyTo?: string
    },
    context: FunctionContext
): Promise<SmtpSendResult> => {
    const transport = getTransport(context);
    const from = resolveFrom(context, data.From);

    if (data.Attachments && !Array.isArray(data.Attachments)) {
        data.Attachments = [data.Attachments];
    }

    try {
        const info = await transport.sendMail({
            from,
            to: toAddressList(data.To),
            cc: toAddressList(data.Cc),
            bcc: toAddressList(data.Bcc),
            replyTo: data.ReplyTo,
            subject: data.Subject,
            text: data.Text,
            ...(data.Html ? { html: data.Html } : {}),
            ...(data.Attachments && data.Attachments.length > 0
                ? {
                      attachments: data.Attachments.map((attachment:File<string>) => ({
                          filename: attachment.fileName,
                          content: attachment.value,
                          contentType: attachment.contentType as string,
                          encoding: attachment.valueType,
                      })),
                  }
                : {}),
        });

        const envelope = (info.envelope ?? {}) as { from?: unknown; to?: unknown };

        return SmtpSendResultSchema.parse({
            messageId: info.messageId ?? "",
            accepted: (info.accepted ?? []).map(normalizeAddress),
            rejected: (info.rejected ?? []).map(normalizeAddress),
            response: info.response ?? "",
            from: normalizeAddress(envelope.from),
            to: Array.isArray(envelope.to) ? envelope.to.map(normalizeAddress) : [normalizeAddress(envelope.to)].filter((a) => a.length > 0)
        });
    } catch (error: unknown) {
        if (error instanceof RuntimeError) {
            throw error;
        }
        if (error instanceof Error) {
            throw new RuntimeError("ERROR_SENDING_EMAIL", error.message);
        }
        throw new RuntimeError("ERROR_SENDING_EMAIL", "An error occurred while sending the email.");
    }
};
