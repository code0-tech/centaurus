import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { SendEmailRequestDataSchema } from "../src/helpers.js";
import { SmtpSendResultSchema } from "../src/data_types/smtpSendResult.js";
import { SmtpAttachmentSchema } from "../src/data_types/smtpAttachment.js";
import { CreateAttachmentFunction } from "../src/functions/utils/createAttachmentFunction.js";

describe("SendEmailRequestDataSchema", () => {
    it("requires To, Subject and Text", () => {
        expect(() => SendEmailRequestDataSchema.parse({ Subject: "hi", Text: "body" })).toThrow();
        expect(() => SendEmailRequestDataSchema.parse({ To: "a@example.com", Text: "body" })).toThrow();
        expect(() => SendEmailRequestDataSchema.parse({ To: "a@example.com", Subject: "hi" })).toThrow();
    });

    it("accepts optional Html, From, Cc, Bcc, ReplyTo and Attachments", () => {
        const parsed = SendEmailRequestDataSchema.parse({
            To: "a@example.com, b@example.com",
            Subject: "hi",
            Text: "body",
            Html: "<p>body</p>",
            From: "no-reply@example.com",
            Cc: "c@example.com",
            Bcc: "d@example.com",
            ReplyTo: "reply@example.com",
            Attachments: [{ filename: "note.txt", content: "hello" }],
        });
        expect(parsed.To).toEqual("a@example.com, b@example.com");
        expect(parsed.Attachments).toHaveLength(1);
    });
});

describe("SmtpSendResultSchema", () => {
    it("parses a representative send result", () => {
        const result = {
            messageId: "<example-message-id@example.com>",
            accepted: ["a@example.com"],
            rejected: [],
            response: "250 2.0.0 OK",
            envelope: { from: "no-reply@example.com", to: ["a@example.com"] },
        };
        const parsed = SmtpSendResultSchema.parse(result);
        expect(parsed.messageId).toEqual(result.messageId);
        expect(parsed.accepted).toEqual(["a@example.com"]);
    });
});

describe("CreateAttachmentFunction", () => {
    it("builds a valid SMTP_ATTACHMENT object", () => {
        const attachment = new CreateAttachmentFunction().run(
            undefined,
            "invoice.pdf",
            "JVBERi0=",
            "application/pdf",
            "base64"
        );
        expect(() => SmtpAttachmentSchema.parse(attachment)).not.toThrow();
        expect(attachment.filename).toEqual("invoice.pdf");
        expect(attachment.encoding).toEqual("base64");
    });
});
