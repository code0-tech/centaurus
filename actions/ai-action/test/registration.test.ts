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

/** The contents of every file in a folder that ends in the given suffix. */
async function filesIn(folder: string, suffix: string): Promise<{ name: string; content: string }[]> {
    const fs = await import("node:fs/promises");
    const root = new URL("../src/", import.meta.url);
    const found: { name: string; content: string }[] = [];

    for (const entry of await fs.readdir(root, { recursive: true, withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith(suffix)) continue;
        if (!entry.parentPath.includes(folder)) continue;

        found.push({
            name: entry.name,
            content: await fs.readFile(new URL(`${entry.parentPath}/${entry.name}`, "file://"), "utf8"),
        });
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

    it("says what each runtime function is for", async () => {
        // The description is the whole of what the editor can tell someone picking a
        // node out of a list, so a node without one is a name and nothing else.
        const files = await filesIn("runtimefunctions", ".runtimefunction.ts");

        expect(files.length).toBeGreaterThan(0);
        expect(files.filter((file) => !file.content.includes("@Description(")).map((file) => file.name)).toEqual([]);
    });

    it("keeps every signature inside what the platform stores", async () => {
        // A signature is stored in a 500 character column, and one that overruns it is
        // rejected when the action registers rather than when it is written.
        const files = [
            ...(await filesIn("runtimefunctions", ".runtimefunction.ts")),
            ...(await filesIn("runtimeevents", ".runtimeevent.ts")),
        ];

        for (const file of files) {
            const signature: string = /@Signature\(\s*"((?:[^"\\]|\\.)*)"/s.exec(file.content)?.[1] ?? "";
            expect(signature.length, `${file.name} has no signature`).toBeGreaterThan(0);
            expect(signature.length, `${file.name} has a signature of ${signature.length} characters`).toBeLessThan(
                500,
            );
        }
    });

    it("keeps every description inside what the platform stores", async () => {
        // Documentation is stored in a 200 character column - the node's own, every
        // parameter's and every event setting's - and one that overruns it is rejected
        // when the action registers rather than when it is written.
        const files = [
            ...(await filesIn("runtimefunctions", ".runtimefunction.ts")),
            ...(await filesIn("runtimeevents", ".runtimeevent.ts")),
            ...(await filesIn("datatypes", ".datatype.ts")),
        ];

        for (const file of files) {
            // Every translated text of a node is written as `content: "..."`, which is
            // the node's own description as much as a parameter's.
            for (const match of file.content.matchAll(/content:\s*"((?:[^"\\]|\\.)*)"/gs)) {
                const text: string = match[1].replaceAll('\\"', '"');
                const label = `${file.name}: "${text.slice(0, 40)}..."`;

                expect(text.length, `${label} is ${text.length} characters`).toBeLessThanOrEqual(200);
            }
        }
    });

    it("keeps the action's own documentation inside what the platform stores", () => {
        // The module's documentation shares that 200 character column, and it is the
        // one text that lives in index.ts rather than next to a node.
        const documentation: string = /new Action\((?:[^)]*?)"((?:[^"\\]|\\.){40,})"/s.exec(source)?.[1] ?? "";

        expect(documentation.length, "index.ts has no documentation for the action").toBeGreaterThan(0);
        expect(documentation.length, `the action's documentation is ${documentation.length} characters`).toBeLessThanOrEqual(
            200,
        );
    });

    it("is read from the file that actually registers them", () => {
        // A guard for this test itself: a renamed Action constructor call would mean
        // the lists above are no longer what runs.
        expect(source).toContain("new Action(");
        expect(([] as (DataTypeClass | RuntimeFunctionClass)[]).length).toEqual(0);
    });
});
