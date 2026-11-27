import "reflect-metadata";
import { describe, expect, it, vi } from "vitest";
import { SlackMessageSchema } from "../src/data_types/slackMessage.js";
import { parseSlackChannel } from "../src/data_types/slackChannel.js";
import { parseSlackFile } from "../src/data_types/slackFile.js";
import { SlackSlashCommandPayloadSchema } from "../src/data_types/slackSlashCommandPayload.js";
import { SlackReactionAddedEventPayloadSchema } from "../src/data_types/slackReactionAddedEventPayload.js";
import { parseSlackMessage } from "../src/data_types/slackMessage.js";
import {
    buildMessageContent,
    embedToBlocks,
    fromSlackTs,
    fromUnixSeconds,
    getSlackClient,
    resolveUserId,
    toMessageTs,
} from "../src/helpers.js";
import { normalizeEmojiName } from "../src/functions/addReactionFunction.js";
import { normalizeChannelName } from "../src/functions/createChannelFunction.js";

describe("SlackMessageSchema", () => {
    it("parses a chat.postMessage response", () => {
        const parsed = SlackMessageSchema.parse({
            ok: true,
            channel: "C0EXAMPLE",
            ts: "1503435956.000247",
            text: "Deployment finished",
            bot_id: "B0EXAMPLE",
            type: "message",
        });

        expect(parsed.channel).toEqual("C0EXAMPLE");
        expect(parsed.ts).toEqual("1503435956.000247");
    });
});

describe("dates", () => {
    it("converts Slack's Unix seconds into DATE microseconds", () => {
        expect(fromUnixSeconds(1360782400)).toEqual(1360782400_000_000);
        expect(fromUnixSeconds(1.5)).toEqual(1_500_000);
        expect(fromUnixSeconds(undefined)).toBeUndefined();
        expect(fromUnixSeconds(null)).toBeNull();
    });

    it("converts the timestamps of a channel", () => {
        const channel = parseSlackChannel({
            id: "C0EXAMPLE",
            created: 1449252889,
            topic: { value: "Deploys", last_set: 1449252900 },
            purpose: null,
        } as Parameters<typeof parseSlackChannel>[0]);

        expect(channel.created).toEqual(1449252889_000_000);
        expect(channel.topic?.last_set).toEqual(1449252900_000_000);
        expect(channel.purpose).toBeNull();
    });

    it("converts the timestamps of a file", () => {
        const file = parseSlackFile({ id: "F0EXAMPLE", created: 1531763342, timestamp: 1531763343 } as Parameters<
            typeof parseSlackFile
        >[0]);

        expect(file.created).toEqual(1531763342_000_000);
        expect(file.timestamp).toEqual(1531763343_000_000);
    });
});

describe("getSlackClient", () => {
    it("builds a client for the given bot token", () => {
        const first = getSlackClient("xoxb-first");
        const second = getSlackClient(" xoxb-second ");

        expect(first.token).toEqual("xoxb-first");
        expect(second.token).toEqual("xoxb-second");
    });

    it("rejects a missing bot token", () => {
        expect(() => getSlackClient(" ")).toThrow(/bot token/);
        expect(() => getSlackClient(undefined)).toThrow(/bot token/);
    });
});

describe("SlackReactionAddedEventPayloadSchema", () => {
    it("parses a reaction_added delivery and keeps the reacted item", () => {
        const parsed = SlackReactionAddedEventPayloadSchema.parse({
            type: "event_callback",
            team_id: "T0EXAMPLE",
            event_id: "Ev0EXAMPLE",
            event_time: 1234567890,
            event: {
                type: "reaction_added",
                user: "U0EXAMPLE",
                reaction: "white_check_mark",
                item: {
                    type: "message",
                    channel: "C0EXAMPLE",
                    ts: "1360782400.498405",
                },
                event_ts: 1360782804083113,
            },
        });

        expect(parsed.event.reaction).toEqual("white_check_mark");
        expect(parsed.event.item.ts).toEqual("1360782400.498405");
    });

    it("rejects a delivery without the inner event", () => {
        expect(() =>
            SlackReactionAddedEventPayloadSchema.parse({
                type: "event_callback",
            }),
        ).toThrow();
    });
});

describe("SlackSlashCommandPayloadSchema", () => {
    it("parses a form encoded slash command invocation", () => {
        const parsed = SlackSlashCommandPayloadSchema.parse({
            command: "/deploy",
            text: "staging",
            channel_id: "C0EXAMPLE",
            user_id: "U0EXAMPLE",
            response_url:
                "https://hooks.slack.com/commands/T0EXAMPLE/000/example",
        });

        expect(parsed.command).toEqual("/deploy");
        expect(parsed.text).toEqual("staging");
    });

    it("requires a command", () => {
        expect(() =>
            SlackSlashCommandPayloadSchema.parse({ text: "staging" }),
        ).toThrow();
    });
});

describe("normalizeEmojiName", () => {
    it("strips the surrounding colons and whitespace Slack users type", () => {
        expect(normalizeEmojiName(":thumbsup:")).toBe("thumbsup");
        expect(normalizeEmojiName("  white_check_mark ")).toBe("white_check_mark");
    });

    it("keeps inner colons such as skin tone modifiers", () => {
        expect(normalizeEmojiName(":thumbsup::skin-tone-2:")).toBe("thumbsup::skin-tone-2");
    });
});

describe("normalizeChannelName", () => {
    it("turns arbitrary text into a valid Slack channel name", () => {
        expect(normalizeChannelName("#Release Planning Q3!")).toBe("release-planning-q3");
        expect(normalizeChannelName("  Über  Straße / Team_A  ")).toBe("uber-strasse-team_a");
        expect(normalizeChannelName("already-valid_name")).toBe("already-valid_name");
    });

    it("caps the name at 80 characters without a trailing hyphen", () => {
        const name = normalizeChannelName(`${"a".repeat(79)} b`);
        expect(name).toBe("a".repeat(79));
        expect(normalizeChannelName("x".repeat(100))).toHaveLength(80);
    });

    it("returns an empty string when nothing usable is left", () => {
        expect(normalizeChannelName("#!?")).toBe("");
    });
});


describe("message IDs", () => {
    it("converts event timestamps into DATE microseconds", () => {
        expect(fromSlackTs("1712345678.123456")).toBe(1712345678123456);
        expect(fromSlackTs("1712345678.000001")).toBe(1712345678000001);
        expect(fromSlackTs("1712345678")).toBe(1712345678000000);
        expect(fromSlackTs(undefined)).toBeUndefined();
        expect(fromSlackTs("not a ts")).toBeUndefined();
    });

    it("accepts a message ID or a message link", () => {
        expect(toMessageTs("1712345678.123456", "X")).toBe("1712345678.123456");
        expect(toMessageTs(" 1712345678.000001 ", "X")).toBe("1712345678.000001");
        expect(toMessageTs("https://team.slack.com/archives/C1/p1712345678123456", "X")).toBe("1712345678.123456");
    });

    it("rejects a missing or malformed message ID and names the format", () => {
        expect(() => toMessageTs(undefined, "SLACK_X")).toThrow(/1712345678\.123456/);
        expect(() => toMessageTs("", "SLACK_X")).toThrow(/message ID/);
        expect(() => toMessageTs("yesterday", "SLACK_X")).toThrow(/message ID/);
        expect(() => toMessageTs("1712345678.12", "SLACK_X")).toThrow(/message ID/);
    });

    it("keeps the message IDs of a chat.postMessage response as text", () => {
        const message = parseSlackMessage({
            ok: true,
            channel: "C1",
            ts: "1503435956.000247",
            message: { text: "hi", thread_ts: "1503435900.000100", blocks: [{ type: "section" }] } as object,
        });

        expect(message).toEqual({
            ok: true,
            channel: "C1",
            ts: "1503435956.000247",
            thread_ts: "1503435900.000100",
            text: "hi",
        });
    });
});

describe("embeds", () => {
    it("turns every part of an embed into the matching Block Kit block", () => {
        expect(
            embedToBlocks({
                title: "Order shipped",
                text: "Order *#1001* is on its way.",
                fields: [
                    { name: "Carrier", value: "GLS" },
                    { name: "Tracking", value: "<https://example.com|123>" },
                ],
                thumbnailUrl: "https://example.com/logo.png",
                imageUrl: "https://example.com/map.png",
                footer: "Sent by code0",
            })
        ).toEqual([
            { type: "header", text: { type: "plain_text", text: "Order shipped", emoji: true } },
            {
                type: "section",
                text: { type: "mrkdwn", text: "Order *#1001* is on its way." },
                accessory: { type: "image", image_url: "https://example.com/logo.png", alt_text: "Order shipped" },
            },
            {
                type: "section",
                fields: [
                    { type: "mrkdwn", text: "*Carrier*\nGLS" },
                    { type: "mrkdwn", text: "*Tracking*\n<https://example.com|123>" },
                ],
            },
            { type: "image", image_url: "https://example.com/map.png", alt_text: "Order shipped" },
            { type: "context", elements: [{ type: "mrkdwn", text: "Sent by code0" }] },
        ]);
    });

    it("skips unset parts, including null values from the flow", () => {
        expect(embedToBlocks({ title: null, text: " ", fields: null, footer: "Footer" })).toEqual([
            { type: "context", elements: [{ type: "mrkdwn", text: "Footer" }] },
        ]);
        expect(embedToBlocks(undefined)).toEqual([]);
    });

    it("splits more than 10 fields over several sections, as Slack allows 10 per section", () => {
        const fields = Array.from({ length: 12 }, (_, index) => ({ name: `F${index}`, value: "v" }));
        const blocks = embedToBlocks({ fields });

        expect(blocks).toHaveLength(2);
        expect((blocks[0].fields as unknown[]).length).toBe(10);
        expect((blocks[1].fields as unknown[]).length).toBe(2);
    });

    it("shows a thumbnail without a section to sit next to as an image", () => {
        expect(embedToBlocks({ thumbnailUrl: "https://example.com/a.png" })).toEqual([
            { type: "image", image_url: "https://example.com/a.png", alt_text: "Thumbnail" },
        ]);
    });
});

describe("buildMessageContent", () => {
    it("sends a plain text without blocks", () => {
        expect(buildMessageContent("X", "Hello", undefined)).toEqual({ text: "Hello" });
    });

    it("puts the text above the embed and keeps it as the notification text", () => {
        const content = buildMessageContent("X", "Heads up", { title: "Deploy" });

        expect(content.text).toBe("Heads up");
        expect(content.blocks).toEqual([
            { type: "section", text: { type: "mrkdwn", text: "Heads up" } },
            { type: "header", text: { type: "plain_text", text: "Deploy", emoji: true } },
        ]);
    });

    it("falls back to the embed title as notification text", () => {
        expect(buildMessageContent("X", undefined, { title: "Deploy", text: "Done" }).text).toBe("Deploy");
    });

    it("rejects a message without text and embed content", () => {
        expect(() => buildMessageContent("SLACK_X", " ", { title: "" })).toThrow(/text or an embed/);
    });
});

describe("resolveUserId", () => {
    const client = (lookup: (email: string) => Promise<unknown>) =>
        ({ users: { lookupByEmail: vi.fn(({ email }: { email: string }) => lookup(email)) } }) as never;

    it("accepts user IDs, mentions and email addresses", async () => {
        const slack = client(async (email) => ({ ok: true, user: { id: email === "ada@example.com" ? "U0ADA" : "U0X" } }));

        await expect(resolveUserId(slack, "U0123", "X")).resolves.toBe("U0123");
        await expect(resolveUserId(slack, "<@U0456|bob>", "X")).resolves.toBe("U0456");
        await expect(resolveUserId(slack, " ada@example.com ", "X")).resolves.toBe("U0ADA");
    });

    it("returns undefined when no user is given", async () => {
        const slack = client(async () => ({ ok: true }));

        await expect(resolveUserId(slack, " ", "X")).resolves.toBeUndefined();
        await expect(resolveUserId(slack, undefined, "X")).resolves.toBeUndefined();
    });

    it("names the email address no user was found for", async () => {
        const slack = client(async () => {
            throw { code: "slack_webapi_platform_error", data: { error: "users_not_found" } };
        });

        await expect(resolveUserId(slack, "nobody@example.com", "SLACK_X")).rejects.toThrow(/nobody@example.com/);
    });
});
