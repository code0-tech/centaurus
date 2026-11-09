import {
    Alias,
    Description,
    DisplayIcon,
    DisplayMessage,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
    type SubFlowFunctionDefinition,
    ThrowsError,
} from "@code0-tech/hercules";
import { asList } from "../../utils/shared/Shared.asList.util.js";
import { requireText } from "../../utils/shared/Shared.requireText.util.js";

interface Skill {
    title: string;
    markdown: string;
}

const TITLE_KEY = (title: string): string => title.normalize("NFKC").trim().toLocaleLowerCase();

/**
 * Finds the first Markdown heading, accepting ATX headings at any level and the
 * older setext form. Fenced code blocks are skipped so an example heading cannot
 * become the skill's title.
 */
function titleOf(markdown: string, index: number): string {
    const lines: string[] = markdown.replace(/^\uFEFF/, "").split(/\r?\n/);
    let fenced = false;

    for (let line = 0; line < lines.length; line += 1) {
        const current: string = lines[line];
        if (/^\s{0,3}(```|~~~)/.test(current)) {
            fenced = !fenced;
            continue;
        }
        if (fenced) continue;

        const atx = current.match(/^\s{0,3}#{1,6}(?:\s+|$)(.*?)\s*#*\s*$/);
        if (atx) {
            const title: string = atx[1].trim();
            if (title.length > 0) return title;
        }

        const next: string | undefined = lines[line + 1];
        if (current.trim().length > 0 && next && /^\s{0,3}(=+|-+)\s*$/.test(next)) {
            return current.trim();
        }
    }

    throw new RuntimeError(
        "ERROR_INVALID_AI_SKILL",
        `Skill ${index + 1} has no Markdown heading to use as its title.`,
    );
}

function skillInput(input: unknown): string {
    if (typeof input === "string") return input;
    if (typeof input !== "object" || input === null) {
        throw new RuntimeError(
            "ERROR_INVALID_AI_SKILL",
            'The "use_skill" tool needs an object with a "title" text.',
        );
    }

    const title: unknown = (input as { title?: unknown }).title;
    return requireText(title, "ERROR_INVALID_AI_SKILL", 'The "title" argument of "use_skill" is required.');
}

@Identifier("ai::agent::skills")
@DisplayIcon("tabler:books")
@Signature("(skills: LIST<TEXT>): ((title: TEXT) => TEXT)")
@Name({ code: "en-US", content: "Skills" })
@Alias({ code: "en-US", content: "skill;skills;instructions;knowledge;agent;markdown" })
@Description({
    code: "en-US",
    content:
        "Creates a tool that lets an agent load one of the supplied Markdown skills by its title when it needs the skill.",
})
@DisplayMessage({ code: "en-US", content: "Make ${skills} available as skills" })
@ThrowsError()
@Parameter({
    runtimeName: "skills",
    name: [{ code: "en-US", content: "Skills" }],
    description: [
        {
            code: "en-US",
            content:
                "Markdown documents the agent can load by their first heading. Every document needs a title, and titles must be unique.",
        },
    ],
})
export class SkillsFunction {
    run(_context: FunctionContext, skills: unknown[]): SubFlowFunctionDefinition<string> {
        const entries: Skill[] = asList(skills, "skills").map((skill, index) => {
            const markdown: string = requireText(
                skill,
                "ERROR_INVALID_AI_SKILL",
                `Entry ${index + 1} of "skills" has to be a Markdown text.`,
            );
            return { title: titleOf(markdown, index), markdown };
        });

        const seen = new Set<string>();
        entries.forEach((skill) => {
            const key: string = TITLE_KEY(skill.title);
            if (seen.has(key)) {
                throw new RuntimeError(
                    "ERROR_INVALID_AI_SKILL",
                    `More than one skill is titled "${skill.title}". Skill titles must be unique.`,
                );
            }
            seen.add(key);
        });

        const byTitle = new Map(entries.map((skill) => [TITLE_KEY(skill.title), skill.markdown]));
        const titles: string[] = entries.map((skill) => skill.title);
        return {
            name: "use_skill",
            description: `Loads a Markdown skill by title. Available skills: ${titles.join(", ")}.`,
            inputSchema: {
                type: "object",
                properties: {
                    title: { type: "string", enum: titles },
                },
                required: ["title"],
                additionalProperties: false,
            },
            outputSchema: { type: "string" },
            run: async (input: unknown): Promise<string> => {
                const requested: string = skillInput(input);
                const markdown: string | undefined = byTitle.get(TITLE_KEY(requested));
                if (markdown === undefined) {
                    throw new RuntimeError(
                        "ERROR_INVALID_AI_SKILL",
                        `There is no skill titled "${requested}". Available skills: ${titles.join(", ")}.`,
                    );
                }
                return markdown;
            },
        };
    }
}
