import "reflect-metadata";
import { RuntimeError } from "@code0-tech/hercules";
import { describe, expect, it } from "vitest";
import { SkillsFunction } from "../src/runtimefunctions/agent/Agent.skills.runtimefunction.js";

const skills = new SkillsFunction();
const context = {} as never;

describe("ai::agent::skills", () => {
    it("creates a named tool that returns the complete Markdown skill", async () => {
        const tool = skills.run(context, [
            "Intro text\n\n## SQL Analysis ##\n\nUse the query plan.",
            "Customer Support\n================\n\nBe concise.",
        ]);

        expect(tool.name).toEqual("Use a skill");
        expect(tool.description).toContain("SQL Analysis");
        expect(tool.inputSchema).toMatchObject({
            properties: { title: { enum: ["SQL Analysis", "Customer Support"] } },
        });
        await expect(tool.run({ title: "sql analysis" } as never)).resolves.toContain("Use the query plan.");
        await expect(tool.run({ title: "sql analysis" } as never)).resolves.toContain("## SQL Analysis ##");
    });

    it("accepts headings at any Markdown level and ignores fenced examples", async () => {
        const tool = skills.run(context, ["```md\n# Not the title\n```\n\n### Actual title\n\nBody"]);

        await expect(tool.run({ title: "Actual title" } as never)).resolves.toContain("Body");
    });

    it("prefers a front matter title over the body", async () => {
        const tool = skills.run(context, ["---\nname: Billing\ntitle: Refund policy\n---\n\n# Body heading\n\nText"]);

        expect(tool.inputSchema).toMatchObject({ properties: { title: { enum: ["Refund policy"] } } });
        await expect(tool.run({ title: "refund policy" } as never)).resolves.toContain("Text");
    });

    it("derives a title from plain text without any heading", async () => {
        const tool = skills.run(context, [
            "- **Escalation** rules for [support](https://example.com)\nmore",
            "```\nonly fenced content\n```",
            "***",
        ]);

        expect(tool.inputSchema).toMatchObject({
            properties: {
                title: { enum: ["Escalation rules for support", "only fenced content", "Skill 3"] },
            },
        });
    });

    it("shortens very long titles", () => {
        const tool = skills.run(context, [`# ${"word ".repeat(40)}`]);
        const [title] = (tool.inputSchema as { properties: { title: { enum: string[] } } }).properties
            .title.enum;

        expect(title.length).toBeLessThanOrEqual(81);
        expect(title.endsWith("\u2026")).toBe(true);
    });

    it("numbers repeated titles instead of failing", async () => {
        const tool = skills.run(context, ["# Same\none", "## same\ntwo", "Same\n---\nthree"]);

        expect(tool.inputSchema).toMatchObject({
            properties: { title: { enum: ["Same", "same (2)", "Same (3)"] } },
        });
        await expect(tool.run({ title: "Same" } as never)).resolves.toContain("one");
        await expect(tool.run({ title: "same (2)" } as never)).resolves.toContain("two");
        await expect(tool.run({ title: "same (3)" } as never)).resolves.toContain("three");
    });

    it("rejects empty entries and unknown requests", async () => {
        expect(() => skills.run(context, ["   "])).toThrow(RuntimeError);

        const tool = skills.run(context, ["# Known\nbody"]);
        await expect(tool.run({ title: "Missing" } as never)).rejects.toThrow(/There is no skill titled/);
    });
});
