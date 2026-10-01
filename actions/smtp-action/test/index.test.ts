import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { SmtpSendResultSchema } from "../src/data_types/smtpSendResult.js";

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
