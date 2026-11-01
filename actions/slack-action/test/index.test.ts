import "reflect-metadata";
import { createHmac } from "node:crypto";
import { FunctionContext } from "@code0-tech/hercules";
import { describe, expect, it } from "vitest";
import { SlackMessageSchema } from "../src/data_types/slackMessage.js";
import { SlackSlashCommandPayloadSchema } from "../src/data_types/slackSlashCommandPayload.js";
import { SlackReactionAddedEventPayloadSchema } from "../src/data_types/slackReactionAddedEventPayload.js";
import { toBlockArgument, verifyRequestSignature } from "../src/helpers.js";
import { CreateBlockFunction } from "../src/functions/utils/createBlockFunction.js";
import { CreateTextSectionFunction } from "../src/functions/utils/createTextSectionFunction.js";

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
