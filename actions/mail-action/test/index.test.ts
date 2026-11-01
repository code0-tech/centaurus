import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { MailSendResultSchema } from "../src/data_types/mailSendResult.js";
import { ReceivedMailSchema } from "../src/data_types/receivedMail.js";
import { matchesAddresses } from "../src/imapListener.js";

describe("MailSendResultSchema", () => {
    it("parses a representative send result", () => {
        const result = {
            messageId: "<example-message-id@example.com>",
            accepted: ["a@example.com"],
            rejected: [],
            response: "250 2.0.0 OK",
            from: "no-reply@example.com",
            to: ["a@example.com"],
        };
        const parsed = MailSendResultSchema.parse(result);
        expect(parsed.messageId).toEqual(result.messageId);
        expect(parsed.accepted).toEqual(["a@example.com"]);
        expect(parsed.from).toEqual("no-reply@example.com");
        expect(parsed.to).toEqual(["a@example.com"]);
    });
});

describe("ReceivedMailSchema", () => {
    it("parses a representative received mail", () => {
        const result = {
            messageId: "<example-message-id@example.com>",
            from: "sender@example.com",
            to: ["recipient@example.com"],
            cc: ["other@example.com"],
            subject: "Hello",
            text: "Hello there",
            html: "<p>Hello there</p>",
            date: "2026-01-01T00:00:00.000Z",
        };
        const parsed = ReceivedMailSchema.parse(result);
        expect(parsed.messageId).toEqual(result.messageId);
        expect(parsed.from).toEqual("sender@example.com");
        expect(parsed.to).toEqual(["recipient@example.com"]);
        expect(parsed.cc).toEqual(["other@example.com"]);
        expect(parsed.subject).toEqual("Hello");
        expect(parsed.html).toEqual("<p>Hello there</p>");
    });
});

describe("matchesAddresses", () => {
    it("matches everything when no addresses are configured", () => {
        expect(matchesAddresses(["someone@example.com"], [])).toBe(true);
    });

    it("matches a configured address case-insensitively", () => {
        expect(matchesAddresses(["Someone@Example.com"], ["someone@example.com"])).toBe(true);
    });

    it("does not match when no recipient is configured", () => {
        expect(matchesAddresses(["someone@example.com"], ["other@example.com"])).toBe(false);
    });
});
