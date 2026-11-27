import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { HubSpotContactSchema } from "../src/data_types/hubspotContact.js";
import { HubSpotSearchResultSchema } from "../src/data_types/hubspotSearchResult.js";
import { HubSpotWebhookEventSchema } from "../src/data_types/hubspotWebhookEvent.js";
import { parseProperties } from "../src/helpers.js";

describe("HubSpotContactSchema", () => {
    it("parses a representative HubSpot object response", () => {
        const response = {
            id: "512",
            properties: { email: "ada@example.com", firstname: "Ada", lastname: null },
            createdAt: "2026-07-23T12:00:00.000Z",
            updatedAt: "2026-07-23T12:05:00.000Z",
            archived: false,
        };
        const parsed = HubSpotContactSchema.parse(response);
        expect(parsed.id).toEqual("512");
        expect(parsed.properties.email).toEqual("ada@example.com");
        expect(parsed.properties.lastname).toBeNull();
    });

    it("rejects an object without an id", () => {
        expect(() => HubSpotContactSchema.parse({ properties: {} })).toThrow();
    });
});

describe("HubSpotSearchResultSchema", () => {
    it("parses a search result with a total and results array", () => {
        const parsed = HubSpotSearchResultSchema.parse({
            total: 1,
            results: [{ id: "1", properties: { name: "Acme" } }],
        });
        expect(parsed.total).toEqual(1);
        expect(parsed.results).toHaveLength(1);
    });
});

describe("HubSpotWebhookEventSchema", () => {
    it("parses a property-change webhook event", () => {
        const parsed = HubSpotWebhookEventSchema.parse({
            objectId: 123,
            subscriptionType: "deal.propertyChange",
            propertyName: "dealstage",
            propertyValue: "closedwon",
        });
        expect(parsed.propertyName).toEqual("dealstage");
    });
});

describe("parseProperties", () => {
    it("returns an empty object for empty input", () => {
        expect(parseProperties(undefined)).toEqual({});
        expect(parseProperties("")).toEqual({});
    });

    it("parses a JSON object and stringifies values", () => {
        expect(parseProperties('{"firstname":"Ada","amount":42}')).toEqual({
            firstname: "Ada",
            amount: "42",
        });
    });

    it("throws on invalid JSON", () => {
        expect(() => parseProperties("not json")).toThrow();
    });

    it("throws when JSON is not an object", () => {
        expect(() => parseProperties("[1,2,3]")).toThrow();
    });
});
