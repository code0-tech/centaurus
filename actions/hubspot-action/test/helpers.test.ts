import "reflect-metadata";
import { createHash, createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createPropertyMap, parseProperties, verifyWebhookSignature } from "../src/helpers.js";
import { HubSpotCreateSearchFilterFunction } from "../src/functions/utils/hubspotCreateSearchFilterFunction.js";
import { HubSpotCreateAssociationTypeFunction } from "../src/functions/utils/hubspotCreateAssociationTypeFunction.js";
import { HubSpotDealStageChangedWebhookPayloadSchema } from "../src/data_types/hubspotDealStageChangedWebhookPayload.js";
import { HubSpotFormSubmittedWebhookPayloadSchema } from "../src/data_types/hubspotFormSubmittedWebhookPayload.js";

describe("property maps", () => {
    it("builds a map from parallel lists", () => {
        expect(createPropertyMap(["firstname", "lifecyclestage"], ["Ada", "lead"])).toEqual({
            firstname: "Ada",
            lifecyclestage: "lead",
        });
    });

    it("rejects lists of different length", () => {
        expect(() => createPropertyMap(["a", "b"], ["1"])).toThrow();
    });

    it("accepts a property map object as well as a JSON string", () => {
        expect(parseProperties({ firstname: "Ada", amount: 42 })).toEqual({ firstname: "Ada", amount: "42" });
        expect(parseProperties('{"firstname":"Ada"}')).toEqual({ firstname: "Ada" });
    });
});

describe("hubspotCreateSearchFilter", () => {
    const fn = new HubSpotCreateSearchFilterFunction();

    it("builds an EQ filter and normalises the operator", () => {
        expect(fn.run(undefined, "email", "eq", "ada@example.com")).toEqual({
            propertyName: "email",
            operator: "EQ",
            value: "ada@example.com",
        });
    });

    it("rejects unknown operators and IN without values", () => {
        expect(() => fn.run(undefined, "email", "LIKE", "x")).toThrow();
        expect(() => fn.run(undefined, "dealstage", "IN")).toThrow();
    });
});

describe("hubspotCreateAssociationType", () => {
    const fn = new HubSpotCreateAssociationTypeFunction();

    it("defaults to HUBSPOT_DEFINED", () => {
        expect(fn.run(undefined, 3)).toEqual({ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 });
    });

    it("rejects invalid categories and ids", () => {
        expect(() => fn.run(undefined, 3, "SOMETHING")).toThrow();
        expect(() => fn.run(undefined, 1.5)).toThrow();
    });
});

describe("webhook payloads", () => {
    it("parses a batched deal stage change delivery", () => {
        const parsed = HubSpotDealStageChangedWebhookPayloadSchema.parse([
            { objectId: 1, subscriptionType: "deal.propertyChange", propertyName: "dealstage", propertyValue: "closedwon" },
            { objectId: 2, subscriptionType: "deal.propertyChange", propertyName: "dealstage", propertyValue: "appointmentscheduled" },
        ]);
        expect(parsed).toHaveLength(2);
    });

    it("rejects a property change without the property name", () => {
        expect(() =>
            HubSpotDealStageChangedWebhookPayloadSchema.parse([{ objectId: 1, subscriptionType: "deal.propertyChange" }])
        ).toThrow();
    });

    it("parses a form submission payload", () => {
        const parsed = HubSpotFormSubmittedWebhookPayloadSchema.parse({
            formId: "abc",
            values: [{ name: "email", value: "ada@example.com" }],
        });
        expect(parsed.values?.[0].value).toEqual("ada@example.com");
    });
});

describe("verifyWebhookSignature", () => {
    const secret = "test-secret";
    const payload = [{ eventId: 1, objectId: 123, subscriptionType: "contact.creation" }];
    const body = JSON.stringify(payload);
    const url = "https://hooks.example.com/hubspot?x=1";

    it("accepts a valid v1 signature and rejects a tampered body", () => {
        const signature = createHash("sha256").update(secret + body).digest("hex");
        const headers = { "X-HubSpot-Signature": signature, "X-HubSpot-Signature-Version": "v1" };
        expect(verifyWebhookSignature(secret, headers, payload, "POST", undefined)).toBe(true);
        expect(verifyWebhookSignature(secret, headers, [{ ...payload[0], objectId: 999 }], "POST", undefined)).toBe(false);
    });

    it("accepts a valid v2 signature", () => {
        const signature = createHash("sha256").update(secret + "POST" + url + body).digest("hex");
        const headers = { "x-hubspot-signature": signature, "x-hubspot-signature-version": "v2" };
        expect(verifyWebhookSignature(secret, headers, payload, "POST", url)).toBe(true);
    });

    it("accepts a fresh v3 signature and rejects a stale one", () => {
        const now = 1_800_000_000_000;
        const timestamp = String(now - 1000);
        const signature = createHmac("sha256", secret).update("POST" + url + body + timestamp).digest("base64");
        const headers = { "x-hubspot-signature-v3": signature, "x-hubspot-request-timestamp": timestamp };
        expect(verifyWebhookSignature(secret, headers, payload, "POST", url, now)).toBe(true);
        expect(verifyWebhookSignature(secret, headers, payload, "POST", url, now + 10 * 60 * 1000)).toBe(false);
        expect(verifyWebhookSignature("wrong", headers, payload, "POST", url, now)).toBe(false);
    });

    it("returns false without a signature header", () => {
        expect(verifyWebhookSignature(secret, {}, payload, "POST", url)).toBe(false);
    });
});
