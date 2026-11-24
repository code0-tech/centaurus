import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { toSubFlowArguments } from "../src/utils/shared/Shared.toSubFlowArguments.util.js";

/** The schema of a sub flow that takes a bot token, a channel and a message. */
const getMessage = {
    type: "object",
    properties: {
        bot_token: { type: "string" },
        channel_id: { type: "string" },
        message_id: { type: "string" },
    },
    required: ["bot_token", "channel_id", "message_id"],
    additionalProperties: false,
};

describe("turning a tool call into a sub flow's parameters", () => {
    it("orders the arguments the way the schema declares the parameters", () => {
        const args = { message_id: "157478", bot_token: "token", channel_id: "channel" };

        expect(toSubFlowArguments(args, getMessage)).toEqual(["token", "channel", "157478"]);
    });

    it("holds a left out parameter's position open with null", () => {
        const schema = {
            type: "object",
            properties: { channel: { type: "string" }, thread: { type: "string" }, text: { type: "string" } },
            required: ["channel", "text"],
        };

        expect(toSubFlowArguments({ channel: "general", text: "hello" }, schema)).toEqual(["general", null, "hello"]);
    });

    it("drops the parameters nobody passed from the end", () => {
        const schema = {
            type: "object",
            properties: { channel: { type: "string" }, text: { type: "string" }, thread: { type: "string" } },
        };

        expect(toSubFlowArguments({ channel: "general", text: "hello" }, schema)).toEqual(["general", "hello"]);
    });

    it("passes a value of its own through, nested or false", () => {
        const schema = {
            type: "object",
            properties: { filter: { type: "object" }, silent: { type: "boolean" } },
        };

        expect(toSubFlowArguments({ filter: { state: "open" }, silent: false }, schema)).toEqual([
            { state: "open" },
            false,
        ]);
    });

    it("calls a sub flow that declared no parameters with none", () => {
        expect(toSubFlowArguments({ stray: 1 }, { type: "object", properties: {} })).toEqual([]);
    });

    it("hands a sub flow that declared no object schema the argument as it is", () => {
        expect(toSubFlowArguments({ title: "Refunds" }, undefined)).toEqual([{ title: "Refunds" }]);
        expect(toSubFlowArguments("Refunds", { type: "string" })).toEqual(["Refunds"]);
    });

    it("hands an argument that is not an object over unchanged", () => {
        expect(toSubFlowArguments("A-1", getMessage)).toEqual(["A-1"]);
        expect(toSubFlowArguments(["A-1"], getMessage)).toEqual([["A-1"]]);
    });
});
