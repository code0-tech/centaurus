import "reflect-metadata";
import { createHmac } from "node:crypto";
import { FunctionContext } from "@code0-tech/hercules";
import { describe, expect, it } from "vitest";
import { SlackMessageSchema } from "../src/data_types/slackMessage.js";
import { parseSlackChannel } from "../src/data_types/slackChannel.js";
import { parseSlackFile } from "../src/data_types/slackFile.js";
import { SlackSlashCommandPayloadSchema } from "../src/data_types/slackSlashCommandPayload.js";
import { SlackReactionAddedEventPayloadSchema } from "../src/data_types/slackReactionAddedEventPayload.js";
import { fromUnixSeconds, getSlackClient, toBlockArgument, verifyRequestSignature } from "../src/helpers.js";
import { CreateBlockFunction } from "../src/functions/utils/createBlockFunction.js";
import { CreateTextSectionFunction } from "../src/functions/utils/createTextSectionFunction.js";
import { normalizeEmojiName } from "../src/functions/addReactionFunction.js";

const SIGNING_SECRET = "example-signing-secret";

/** A FunctionContext exposing just the configs the helpers read. */
const contextWith = (configs: Record<string, string>): FunctionContext =>
    ({
        projectId: 1,
        executionId: "test",
        matchedConfig: {
            projectId: 1,
            configValues: Object.entries(configs).map(
                ([identifier, value]) => ({ identifier, value }),
            ),
            findConfig: (identifier: string) => configs[identifier],
        },
        executeFlow: async () => undefined,
    }) as unknown as FunctionContext;

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
    it("builds a client for each project's own bot token", () => {
        const first = getSlackClient(contextWith({ bot_token: "xoxb-first" }));
        const second = getSlackClient(contextWith({ bot_token: "xoxb-second" }));

        expect(first.token).toEqual("xoxb-first");
        expect(second.token).toEqual("xoxb-second");
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
                event_ts: "1360782804.083113",
            },
        });

        expect(parsed.event?.reaction).toEqual("white_check_mark");
        expect(parsed.event?.item.ts).toEqual("1360782400.498405");
    });

    it("accepts Slack's url_verification request, which carries a challenge instead of an event", () => {
        const parsed = SlackReactionAddedEventPayloadSchema.parse({
            token: "legacy",
            challenge: "3eZbrw1aBm2rZgRNFdxV2595E9CY3gmdALWMmHkvFXO7tYXAYM8P",
            type: "url_verification",
        });

        expect(parsed.challenge).toEqual("3eZbrw1aBm2rZgRNFdxV2595E9CY3gmdALWMmHkvFXO7tYXAYM8P");
        expect(parsed.event).toBeUndefined();
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

describe("block builders", () => {
    it("builds a mrkdwn section by default and a plain_text one on request", () => {
        const builder = new CreateTextSectionFunction();

        expect(builder.run(undefined, "*bold*")).toEqual({
            type: "section",
            block_id: undefined,
            text: { type: "mrkdwn", text: "*bold*" },
        });
        expect(builder.run(undefined, "*not bold*", false).text?.type).toEqual(
            "plain_text",
        );
    });

    it("renders header text literally and omits unused arguments", () => {
        const builder = new CreateBlockFunction();

        expect(builder.run(undefined, "header", "Release 1.2.0").text).toEqual({
            type: "plain_text",
            text: "Release 1.2.0",
        });
        expect(builder.run(undefined, "divider")).toEqual({
            type: "divider",
            block_id: undefined,
            text: undefined,
            fields: undefined,
            image_url: undefined,
            alt_text: undefined,
        });
    });

    it("turns field texts into text objects", () => {
        const block = new CreateBlockFunction().run(
            undefined,
            "section",
            undefined,
            ["*Env*\nstaging", "*By*\n<@U0E>"],
        );

        expect(block.fields).toEqual([
            { type: "mrkdwn", text: "*Env*\nstaging" },
            { type: "mrkdwn", text: "*By*\n<@U0E>" },
        ]);
    });

    it("puts context texts into elements, because context blocks have no text field", () => {
        const block = new CreateBlockFunction().run(undefined, "context", "Deployed by <@U0E>", ["2 min ago"]);

        expect(block).toEqual({
            type: "context",
            block_id: undefined,
            elements: [
                { type: "mrkdwn", text: "Deployed by <@U0E>" },
                { type: "mrkdwn", text: "2 min ago" },
            ],
        });
    });
});

describe("toBlockArgument", () => {
    it("omits blocks entirely when there are none, because Slack rejects an empty array", () => {
        expect(toBlockArgument()).toEqual({});
        expect(toBlockArgument([])).toEqual({});
        expect(toBlockArgument([{ type: "divider" }])).toEqual({
            blocks: [{ type: "divider" }],
        });
    });
});

describe("verifyRequestSignature", () => {
    const sign = (timestamp: string, body: string, secret = SIGNING_SECRET) =>
        `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${body}`).digest("hex")}`;

    const context = contextWith({
        bot_token: "xoxb-example",
        signing_secret: SIGNING_SECRET,
    });
    const body = "token=example&command=%2Fdeploy&text=staging";

    it("accepts a signature Slack would have produced", () => {
        const timestamp = String(Math.floor(Date.now() / 1000));
        expect(
            verifyRequestSignature(
                context,
                sign(timestamp, body),
                timestamp,
                body,
            ),
        ).toBe(true);
    });

    it("rejects a signature made with a different secret", () => {
        const timestamp = String(Math.floor(Date.now() / 1000));
        expect(
            verifyRequestSignature(
                context,
                sign(timestamp, body, "other-secret"),
                timestamp,
                body,
            ),
        ).toBe(false);
    });

    it("rejects a tampered body", () => {
        const timestamp = String(Math.floor(Date.now() / 1000));
        const signature = sign(timestamp, body);
        expect(
            verifyRequestSignature(
                context,
                signature,
                timestamp,
                `${body}&extra=1`,
            ),
        ).toBe(false);
    });

    it("rejects a replayed request older than five minutes", () => {
        const timestamp = String(Math.floor(Date.now() / 1000) - 60 * 6);
        expect(
            verifyRequestSignature(
                context,
                sign(timestamp, body),
                timestamp,
                body,
            ),
        ).toBe(false);
    });

    it("rejects a non numeric timestamp", () => {
        expect(
            verifyRequestSignature(
                context,
                sign("not-a-time", body),
                "not-a-time",
                body,
            ),
        ).toBe(false);
    });

    it("fails loudly when no signing secret is configured", () => {
        const timestamp = String(Math.floor(Date.now() / 1000));
        expect(() =>
            verifyRequestSignature(
                contextWith({ bot_token: "xoxb-example" }),
                sign(timestamp, body),
                timestamp,
                body,
            ),
        ).toThrow(/signing secret/i);
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

describe("function results", () => {
    // Hercules rejects undefined values when serializing a result ("Unsupported value type: undefined").
    const hasUndefined = (value: unknown): boolean =>
        value === undefined ||
        (value !== null && typeof value === "object" && Object.values(value).some(hasUndefined));

    it("contain no undefined values", () => {
        expect(hasUndefined(new CreateBlockFunction().run(undefined, "divider"))).toBe(false);
        expect(hasUndefined(new CreateBlockFunction().run(undefined, "context", "hi"))).toBe(false);
        expect(hasUndefined(new CreateTextSectionFunction().run(undefined, "hi"))).toBe(false);
        expect(hasUndefined(parseSlackChannel({ id: "C1", topic: {} } as never))).toBe(false);
        expect(hasUndefined(parseSlackFile({ id: "F1" } as never))).toBe(false);
    });
});

describe("toBlockArgument null handling", () => {
    it("drops null fields that unset optional block fields come back as", () => {
        expect(
            toBlockArgument([
                { type: "divider", block_id: null, text: null, fields: null },
                { type: "context", elements: [{ type: "mrkdwn", text: "hi", verbatim: null }] },
            ])
        ).toEqual({
            blocks: [{ type: "divider" }, { type: "context", elements: [{ type: "mrkdwn", text: "hi" }] }],
        });
    });
});

describe("CreateBlockFunction per block type", () => {
    const builder = new CreateBlockFunction();

    it("only keeps the properties Slack allows for a type", () => {
        expect(builder.run(undefined, "divider", "ignored", ["ignored"], "https://x", "alt", "")).toStrictEqual({
            type: "divider",
        });
        expect(builder.run(undefined, "image", "ignored", undefined, "https://x/a.png", "A chart")).toStrictEqual({
            type: "image",
            image_url: "https://x/a.png",
            alt_text: "A chart",
        });
        expect(builder.run(undefined, "header", "Release", ["ignored"])).toStrictEqual({
            type: "header",
            text: { type: "plain_text", text: "Release" },
        });
    });

    it("treats empty strings as unset", () => {
        expect(builder.run(undefined, "section", "Body", ["", "*Env*"], "", "", "")).toStrictEqual({
            type: "section",
            text: { type: "mrkdwn", text: "Body" },
            fields: [{ type: "mrkdwn", text: "*Env*" }],
        });
    });
});
