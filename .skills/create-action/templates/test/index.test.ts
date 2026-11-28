import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

// import { __Vendor__SendMessageFunction } from "../src/functions/messaging/__vendor__SendMessage.js";
// import { __Vendor__MessageCreated } from "../src/events/__vendor__MessageCreated.js";

/** Every runtime function of the action. Keep in sync with src/index.ts. */
const functions: Function[] = [
    // __Vendor__SendMessageFunction,
];

/** Every event of the action. Keep in sync with src/index.ts. */
const events: Function[] = [
    // __Vendor__MessageCreated,
];

/** The name of the credential every function and event takes first. */
const CREDENTIAL = "apiToken";

describe("registration", () => {
    it("registers every function and event in index.ts", async () => {
        const source = await readFile(new URL("../src/index.ts", import.meta.url), "utf8");

        for (const cls of [...functions, ...events]) {
            expect(source, `${cls.name} is not registered in index.ts`).toMatch(
                new RegExp(`register\\w+\\(${cls.name}\\)`)
            );
        }
    });
});

describe("credential", () => {
    it.each(functions)("is the first parameter of %o", (fn) => {
        const parameters = Reflect.getMetadata("hercules:function_parameters", fn) as { runtimeName: string }[];
        const signature = Reflect.getMetadata("hercules:signature", fn) as string;

        expect(parameters[0].runtimeName).toEqual(CREDENTIAL);
        expect(parameters[0]).not.toHaveProperty("optional", true);
        expect(signature.startsWith(`(${CREDENTIAL}: string`)).toBe(true);
    });

    it.each(events)("is the first setting of %o", (event) => {
        const settings = Reflect.getMetadata("hercules:flow_settings", event) as { identifier: string }[];
        const signature = Reflect.getMetadata("hercules:signature", event) as string;

        expect(settings[0].identifier).toEqual(CREDENTIAL);
        expect(settings[0]).not.toHaveProperty("optional", true);
        expect(signature.startsWith(`(${CREDENTIAL}: string`)).toBe(true);
    });
});

describe("parameters", () => {
    it.each(functions)("match the signature and run() of %o", (fn) => {
        const parameters = Reflect.getMetadata("hercules:function_parameters", fn) as { runtimeName: string }[];
        const signature = Reflect.getMetadata("hercules:signature", fn) as string;
        const inSignature = [...signature.matchAll(/(\w+)\??:/g)].map((m) => m[1]);

        expect(parameters.map((p) => p.runtimeName)).toEqual(inSignature);
        // run(context, ...parameters)
        expect((fn as any).prototype.run.length).toEqual(parameters.length + 1);
    });
});

// Add per data type: a mapper test that checks every schema key is present
// (see .skills/test-action/SKILL.md, "Mapper tests").
