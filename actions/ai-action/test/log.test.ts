import "reflect-metadata";
import { afterEach, describe, expect, it, vi } from "vitest";
import { describeValue } from "../src/utils/shared/Log.describeValue.util.js";
import { logger } from "../src/utils/shared/Log.logger.util.js";

const original: string | undefined = process.env.AI_LOG_LEVEL;

afterEach(() => {
    if (original === undefined) delete process.env.AI_LOG_LEVEL;
    else process.env.AI_LOG_LEVEL = original;
    vi.restoreAllMocks();
});

/** The lines a block of code writes, with the level turned up for the test. */
function captured(level: string | undefined, run: () => void): string[] {
    if (level === undefined) delete process.env.AI_LOG_LEVEL;
    else process.env.AI_LOG_LEVEL = level;
    const lines: string[] = [];
    for (const channel of ["log", "warn", "error"] as const) {
        vi.spyOn(console, channel).mockImplementation((...args: unknown[]) => {
            lines.push(args.map(String).join(" "));
        });
    }
    run();
    return lines;
}

describe("the action's logging", () => {
    it("is off while the tests run, so a suite stays readable", () => {
        const lines = captured(undefined, () => {
            logger("openai").debug("a line nobody asked for");
            logger("openai").error("and one that would otherwise show");
        });

        expect(lines).toEqual([]);
    });

    it("writes the scope, the level and the run it belongs to", () => {
        const lines = captured("debug", () => logger("openai", "abc123").info("a request arrived", { status: 200 }));

        expect(lines).toHaveLength(1);
        expect(lines[0]).toContain("INFO  [ai:openai] (abc123) a request arrived");
        expect(lines[0]).toContain('{"status":200}');
        expect(lines[0]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("writes only what the level asks for", () => {
        expect(captured("warn", () => logger("x").debug("quiet"))).toEqual([]);
        expect(captured("warn", () => logger("x").error("loud"))).toHaveLength(1);
        expect(captured("off", () => logger("x").error("silenced"))).toEqual([]);
    });

    it("never writes a key, however deep it sits", () => {
        const line = captured("debug", () =>
            logger("model").debug("the request", {
                api_key: "sk-secret",
                headers: { authorization: "Bearer sk-secret", "api-key": "sk-secret" },
                nested: [{ openRouterApiKey: "sk-secret", prompt: "keep me" }],
            }),
        )[0];

        expect(line).not.toContain("sk-secret");
        expect(line).toContain("keep me");
        expect(line.match(/\[redacted\]/g)).toHaveLength(4);
    });

    it("cuts a value that would bury the line and survives a cycle", () => {
        const long = describeValue({ text: "x".repeat(5000) });
        const cyclic: Record<string, unknown> = { name: "a" };
        cyclic.self = cyclic;

        expect(long.length).toBeLessThan(2100);
        expect(long).toContain("chars)");
        expect(describeValue(cyclic)).toEqual('{"name":"a","self":"[circular]"}');
        expect(describeValue({ id: 7n, run: () => undefined })).toEqual('{"id":"7","run":"[function]"}');
    });

    it("keeps a child's scope and swaps what ties the lines together", () => {
        const lines = captured("debug", () => {
            const parent = logger("openai", "one");
            parent.child("two").warn("second");
        });

        expect(lines[0]).toContain("[ai:openai] (two) second");
    });
});
