import "reflect-metadata";
import {describe, expect, it} from "vitest";
import {subscriberHash} from "../src/helpers.ts";
import {MailchimpMemberSchema} from "../src/data_types/mailchimpMember.ts";
import {MailchimpSubscribeWebhookPayloadSchema} from "../src/data_types/mailchimpSubscribeWebhookPayload.ts";
import {CreateMergeFieldsFunction} from "../src/functions/utils/createMergeFieldsFunction.ts";

describe("subscriberHash", () => {
    it("hashes the lowercased email with MD5", () => {
        expect(subscriberHash("api@mailchimp.com")).toEqual("6def22f266be37015519943ce0c3ae6b");
    });

    it("is case insensitive", () => {
        expect(subscriberHash("API@Mailchimp.com")).toEqual(subscriberHash("api@mailchimp.com"));
    });
});

describe("MailchimpMemberSchema", () => {
    it("parses a representative member response", () => {
        const member = MailchimpMemberSchema.parse({
            id: "6def22f266be37015519943ce0c3ae6b",
            email_address: "api@mailchimp.com",
            status: "subscribed",
            merge_fields: {FNAME: "Mailchimp", LNAME: "API"},
            list_id: "a6b5da1054",
        });
        expect(member.email_address).toEqual("api@mailchimp.com");
        expect(member.status).toEqual("subscribed");
    });
});

describe("MailchimpSubscribeWebhookPayloadSchema", () => {
    it("requires the type literal to match", () => {
        expect(() =>
            MailchimpSubscribeWebhookPayloadSchema.parse({
                type: "unsubscribe",
                data: {email: "api@mailchimp.com"},
            })
        ).toThrow();
    });

    it("parses a representative subscribe webhook payload", () => {
        const payload = MailchimpSubscribeWebhookPayloadSchema.parse({
            type: "subscribe",
            fired_at: "2009-03-26 21:35:57",
            data: {
                id: "8a25ff1d98",
                list_id: "a6b5da1054",
                email: "api@mailchimp.com",
                merges: {FNAME: "Mailchimp", LNAME: "API"},
            },
        });
        expect(payload.data.email).toEqual("api@mailchimp.com");
    });
});

describe("CreateMergeFieldsFunction", () => {
    it("maps named parameters to Mailchimp merge tags, omitting unset ones", () => {
        const fn = new CreateMergeFieldsFunction();
        expect(fn.run(undefined, "Ada", "Lovelace")).toEqual({FNAME: "Ada", LNAME: "Lovelace"});
    });

    it("returns an empty object when nothing is set", () => {
        const fn = new CreateMergeFieldsFunction();
        expect(fn.run(undefined)).toEqual({});
    });
});
