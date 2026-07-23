import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { TwilioMessageSchema } from "../src/data_types/twilioMessage.js";
import { SendMessageRequestDataSchema } from "../src/helpers.js";

describe("TwilioMessageSchema", () => {
    it("parses a representative Twilio message response", () => {
        // Placeholder identifiers only - deliberately not in Twilio's real
        // SID format (AC/SM + 32 hex chars) to avoid tripping secret scanners.
        const response = {
            sid: "SM-example-message-sid",
            account_sid: "AC-example-account-sid",
            messaging_service_sid: null,
            from: "+15017122661",
            to: "+15558675310",
            body: "Hello from Twilio!",
            status: "queued",
            direction: "outbound-api",
            num_segments: "1",
            num_media: "0",
            price: null,
            price_unit: "USD",
            error_code: null,
            error_message: null,
            date_created: "Wed, 22 Jul 2026 12:00:00 +0000",
            date_updated: "Wed, 22 Jul 2026 12:00:00 +0000",
            date_sent: null,
            api_version: "2010-04-01",
            uri: "/2010-04-01/Accounts/AC.../Messages/SM....json",
        };

        const parsed = TwilioMessageSchema.parse(response);
        expect(parsed.sid).toEqual(response.sid);
        expect(parsed.status).toEqual("queued");
    });
});

describe("SendMessageRequestDataSchema", () => {
    it("requires a To and Body", () => {
        expect(() => SendMessageRequestDataSchema.parse({ Body: "hi" })).toThrow();
        expect(() => SendMessageRequestDataSchema.parse({ To: "+15558675310" })).toThrow();
    });

    it("accepts optional From and MediaUrl", () => {
        const parsed = SendMessageRequestDataSchema.parse({
            To: "+15558675310",
            Body: "hi",
            From: "+15017122661",
            MediaUrl: "https://example.com/image.png",
        });
        expect(parsed.From).toEqual("+15017122661");
        expect(parsed.MediaUrl).toEqual("https://example.com/image.png");
    });
});
