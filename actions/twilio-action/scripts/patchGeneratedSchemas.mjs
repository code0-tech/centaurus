// openapi-zod-client emits zod v3 code, but this project uses zod v4,
// where z.record() requires an explicit key schema. Rewrites the
// generated single-argument form z.record(Value) to
// z.record(z.string(), Value). Runs as part of
// "generate:twilio-schemas" right after code generation.
import {readFileSync, writeFileSync} from "node:fs";

const file = new URL("../src/generated/twilio-schemas.ts", import.meta.url);
const source = readFileSync(file, "utf8");
writeFileSync(file, source.replaceAll("z.record(", "z.record(z.string(), "));
