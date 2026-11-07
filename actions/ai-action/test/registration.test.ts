import "reflect-metadata";
import { Action, type DataTypeClass, type RuntimeFunctionClass } from "@code0-tech/hercules";
import { describe, expect, it } from "vitest";

/**
 * What the action actually offers a project.
 *
 * `src/index.ts` connects on import, so the lists are read out of it rather than the
 * module built here: importing it would open a stream to aquila. Registering is a
 * second step after writing a function - a function that exists but is missing from
 * the list is invisible in the editor, and nothing else would catch that.
 */
const source: string = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../src/index.ts", import.meta.url), "utf8"),
);

/** The entries of one of index.ts's registration lists. */
function listed(name: string): string[] {
    const match = new RegExp(`const ${name}[^=]*=\\s*\\[([^\\]]*)\\]`, "s").exec(source);
    if (!match) throw new Error(`index.ts has no ${name} list`);
    return match[1]
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0 && !entry.startsWith("//"));
}

/** Every class the action declares, by the file it lives in. */
async function classesIn(folder: string, suffix: string): Promise<string[]> {
    const fs = await import("node:fs/promises");
    const root = new URL("../src/", import.meta.url);
    const found: string[] = [];

    for (const entry of await fs.readdir(root, { recursive: true, withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith(suffix)) continue;
        if (!entry.parentPath.includes(folder)) continue;

        const file: string = await fs.readFile(new URL(`${entry.parentPath}/${entry.name}`, "file://"), "utf8");
        for (const match of file.matchAll(/export class (\w+)/g)) found.push(match[1]);
    }

    return found;
}

describe("what the action registers", () => {
    it("registers every runtime function it declares", async () => {
        const declared: string[] = await classesIn("runtimefunctions", ".runtimefunction.ts");
        const registered: string[] = listed("RUNTIME_FUNCTIONS");

        expect(declared.length).toBeGreaterThan(0);
        expect([...registered].sort()).toEqual([...declared].sort());
    });

    it("registers every runtime event it declares", async () => {
        const declared: string[] = await classesIn("runtimeevents", ".runtimeevent.ts");
        const registered: string[] = listed("RUNTIME_EVENTS");

        expect([...registered].sort()).toEqual([...declared].sort());
    });

    it("registers every data type it declares", async () => {
        const declared: string[] = await classesIn("datatypes", ".datatype.ts");
        const registered: string[] = listed("DATA_TYPES");

        expect([...registered].sort()).toEqual([...declared].sort());
    });

    it("hands each list to the right registration call", () => {
        expect(source).toContain("DATA_TYPES.forEach((dataType) => action.registerDataTypeClass(dataType))");
        expect(source).toContain(
            "RUNTIME_FUNCTIONS.forEach((runtimeFunction) => action.registerRuntimeFunction(runtimeFunction))",
        );
        expect(source).toContain("RUNTIME_EVENTS.forEach((event) => action.registerRuntimeEventClass(event))");
    });

    it("is read from the file that actually registers them", () => {
        // A guard for this test itself: a renamed Action constructor call would mean
        // the lists above are no longer what runs.
        expect(source).toContain("new Action(");
        expect(([] as (DataTypeClass | RuntimeFunctionClass)[]).length).toEqual(0);
    });
});
