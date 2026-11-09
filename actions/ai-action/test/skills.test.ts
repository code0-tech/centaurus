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

        expect(tool.name).toEqual("use_skill");
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

    it("rejects missing titles, duplicate titles, and unknown requests", async () => {
        expect(() => skills.run(context, ["No heading here"])).toThrow(RuntimeError);
        expect(() => skills.run(context, ["# Same\none", "## same\ntwo"])).toThrow(/titles must be unique/);

        const tool = skills.run(context, ["# Known\nbody"]);
        await expect(tool.run({ title: "Missing" } as never)).rejects.toThrow(/There is no skill titled/);
    });
});
