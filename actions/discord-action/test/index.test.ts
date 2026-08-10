import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { createDiscordEmbedBuilder, sendDiscordWebhook } from "../src/helpers.js";
import { CreateDiscordWebhookUrlFunction } from "../src/functions/createDiscordWebhookUrlFunction.js";
import { CreateDiscordEmbedFunction } from "../src/functions/createDiscordEmbedFunction.js";
import { CreateDiscordEmbedAuthorFunction } from "../src/functions/createDiscordEmbedAuthorFunction.js";
import { CreateDiscordEmbedFooterFunction } from "../src/functions/createDiscordEmbedFooterFunction.js";
import { SendDiscordWebhookFunction } from "../src/functions/sendDiscordWebhookFunction.js";

describe("Discord Action", () => {
    it("should format webhook URL correctly", () => {
        const fn = new CreateDiscordWebhookUrlFunction();
        const url = fn.run(null, "123456789", "token-abc");
        expect(url).toEqual("https://discord.com/api/webhooks/123456789/token-abc");
    });

    it("should parse hex color string (#ff22ff) correctly into EmbedBuilder", () => {
        const embedFn = new CreateDiscordEmbedFunction();
        const embedData = embedFn.run(
            null,
            "Hex Test",
            "Description",
            undefined,
            "#ff22ff"
        );

        expect(embedData.color).toEqual("#ff22ff");

        const builder = createDiscordEmbedBuilder(embedData);
        expect(builder).not.toBeNull();
        const json = builder!.toJSON();
        expect(json.color).toEqual(parseInt("ff22ff", 16));
    });

    it("should parse raw hex string (ff22ff) without hashtag into EmbedBuilder", () => {
        const embedFn = new CreateDiscordEmbedFunction();
        const embedData = embedFn.run(
            null,
            "Hex Test 2",
            "Description",
            undefined,
            "ff22ff"
        );

        const builder = createDiscordEmbedBuilder(embedData);
        expect(builder).not.toBeNull();
        const json = builder!.toJSON();
        expect(json.color).toEqual(parseInt("ff22ff", 16));
    });

    it("should safely handle empty strings in URL and author fields", () => {
        const authorFn = new CreateDiscordEmbedAuthorFunction();
        const author = authorFn.run(null, "John", "", "");

        const embedFn = new CreateDiscordEmbedFunction();
        const embedData = embedFn.run(
            null,
            "Title",
            "Description",
            "",
            "#70ffb2",
            "",
            undefined,
            "",
            "",
            author
        );

        const builder = createDiscordEmbedBuilder(embedData);
        expect(builder).not.toBeNull();
        const json = builder!.toJSON();

        expect(json.title).toEqual("Title");
        expect(json.description).toEqual("Description");
        expect(json.author?.name).toEqual("John");
        expect(json.author?.url).toBeUndefined();
        expect(json.url).toBeUndefined();
    });

    it("should return null for empty embed objects", () => {
        const builder = createDiscordEmbedBuilder({});
        expect(builder).toBeNull();
    });

    it("should use matchedConfig fallback if node parameters are empty", async () => {
        const mockContext: any = {
            matchedConfig: {
                findConfig: (key: string) => {
                    if (key === "webhook_url") return "https://discord.com/api/webhooks/fallback/test";
                    if (key === "username") return "FallbackBot";
                    if (key === "avatar_url") return "https://example.com/fallback.png";
                    return "";
                },
            },
        };

        const sendFn = new SendDiscordWebhookFunction();
        const result = await sendFn.run(mockContext, undefined, "Hello!");
        expect(result).toBeDefined();
    });

    it("should validate missing or invalid webhook URL when no config fallback exists", async () => {
        const mockContext: any = {
            matchedConfig: {
                findConfig: () => "",
            },
        };

        const sendFn = new SendDiscordWebhookFunction();
        const result = await sendFn.run(mockContext, "invalid-url", "Hello!");
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);
        expect(result.message).toEqual("Invalid or missing webhook URL.");
    });
});
