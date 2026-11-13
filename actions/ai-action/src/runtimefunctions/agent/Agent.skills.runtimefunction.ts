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

const TITLE_LIMIT = 80;

const FENCE = /^\s{0,3}(?:```|~~~)/;
const BREAK = /^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/;
const SETEXT = /^\s{0,3}(?:=+|-+)\s*$/;

/**
 * Turns one line into a plain title: list markers, quotes and inline Markdown
 * are dropped so the title reads like text instead of markup.
 */
function plainTitle(line: string): string {
    return line
        .replace(/^\s{0,3}>+\s*/, "")
        .replace(/^\s{0,3}(?:[-*+]|\d{1,9}[.)])\s+/, "")
        .replace(/^\s{0,3}#{1,6}\s*/, "")
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/[`*_~]+/g, "")
        .replace(/\s*#+\s*$/, "")
        .replace(/\s+/g, " ")
        .trim();
}

function shorten(title: string): string {
    if (title.length <= TITLE_LIMIT) return title;
    const cut: string = title.slice(0, TITLE_LIMIT);
    const space: number = cut.lastIndexOf(" ");
    return `${(space > TITLE_LIMIT / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/**
 * Reads a leading YAML front matter block and returns its title, plus the line
 * the document itself starts on.
 */
function frontMatter(lines: string[]): { title?: string; body: number } {
    if (!/^---\s*$/.test(lines[0] ?? "")) return { body: 0 };

    for (let line = 1; line < lines.length; line += 1) {
        if (!/^(?:---|\.\.\.)\s*$/.test(lines[line])) continue;

        const keys: string[] = lines.slice(1, line);
        const entry: string | undefined =
            keys.find((candidate) => /^\s*title\s*:/i.test(candidate)) ??
            keys.find((candidate) => /^\s*name\s*:/i.test(candidate));
        const value: string = plainTitle(
            (entry ?? "").replace(/^[^:]*:\s*/, "").replace(/^["']|["']$/g, ""),
        );
        return { title: value.length > 0 ? value : undefined, body: line + 1 };
    }

    return { body: 0 };
}

/**
 * Finds the first Markdown heading, accepting ATX headings at any level and the
 * older setext form. Fenced code blocks are skipped so an example heading cannot
 * become the skill's title.
 */
function headingTitle(lines: string[]): string | undefined {
    let fenced = false;

    for (let line = 0; line < lines.length; line += 1) {
        const current: string = lines[line];
        if (FENCE.test(current)) {
            fenced = !fenced;
            continue;
        }
        if (fenced) continue;

        const atx = current.match(/^\s{0,3}#{1,6}(?:\s+|$)(.*?)\s*#*\s*$/);
        if (atx) {
            const title: string = plainTitle(atx[1]);
            if (title.length > 0) return title;
        }

        const next: string | undefined = lines[line + 1];
        if (current.trim().length > 0 && next !== undefined && SETEXT.test(next)) {
            const title: string = plainTitle(current);
            if (title.length > 0) return title;
        }
    }

    return undefined;
}

/** Falls back to the first line that carries readable text. */
function firstTextTitle(lines: string[], skipFenced: boolean): string | undefined {
    let fenced = false;

    for (const current of lines) {
        if (FENCE.test(current)) {
            fenced = !fenced;
            continue;
        }
        if (skipFenced && fenced) continue;
        if (current.trim().length === 0 || BREAK.test(current) || SETEXT.test(current)) continue;

        const title: string = plainTitle(current);
        if (title.length > 0) return title;
    }

    return undefined;
}

/**
 * Derives a title from any Markdown text: a front matter title, otherwise the
 * first heading, otherwise the first readable line, and a numbered name as the
 * last resort. Text always yields a title.
 */
function titleOf(markdown: string, index: number): string {
    const lines: string[] = markdown.replace(/^﻿/, "").split(/\r?\n/);
    const front: { title?: string; body: number } = frontMatter(lines);
    const body: string[] = lines.slice(front.body);

    const title: string | undefined =
        front.title ??
        headingTitle(body) ??
        firstTextTitle(body, true) ??
        firstTextTitle(lines, false);

    return shorten(title ?? `Skill ${index + 1}`);
}

/**
 * Keeps titles distinct without failing: a repeated title is numbered, so the
 * agent still sees one entry per skill.
 */
function unique(title: string, taken: Set<string>): string {
    if (!taken.has(TITLE_KEY(title))) return title;

    for (let copy = 2; ; copy += 1) {
        const candidate = `${title} (${copy})`;
        if (!taken.has(TITLE_KEY(candidate))) return candidate;
    }
}

function skillInput(input: unknown): string {
    if (typeof input === "string") return input;
    if (typeof input !== "object" || input === null) {
        throw new RuntimeError(
            "ERROR_INVALID_AI_SKILL",
            'The "Use a skill" tool needs an object with a "title" text.',
        );
    }

    const title: unknown = (input as { title?: unknown }).title;
    return requireText(title, "ERROR_INVALID_AI_SKILL", 'The "title" argument of "Use a skill" is required.');
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
                "Markdown documents the agent can load. A title is taken from the front matter, the first heading or the first line of text. Repeated titles get numbered.",
        },
    ],
})
export class SkillsFunction {
    run(_context: FunctionContext, skills: unknown[]): SubFlowFunctionDefinition<string> {
        const taken = new Set<string>();
        const entries: Skill[] = asList(skills, "skills").map((skill, index) => {
            const markdown: string = requireText(
                skill,
                "ERROR_INVALID_AI_SKILL",
                `Entry ${index + 1} of "skills" has to be a Markdown text.`,
            );
            const title: string = unique(titleOf(markdown, index), taken);
            taken.add(TITLE_KEY(title));
            return { title, markdown };
        });

        const byTitle = new Map(entries.map((skill) => [TITLE_KEY(skill.title), skill.markdown]));
        const titles: string[] = entries.map((skill) => skill.title);
        return {
            // A readable name; the agent turns it into a tool name a model accepts.
            name: "Use a skill",
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
