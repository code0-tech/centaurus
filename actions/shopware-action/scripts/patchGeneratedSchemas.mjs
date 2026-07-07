// openapi-zod-client emits zod v3 code, but this project uses zod v4,
// where z.record() requires an explicit key schema. Rewrites the
// generated single-argument form z.record(Value) to
// z.record(z.string(), Value).
// The Shopware order schemas are mutually recursive, so the generator
// wraps them in z.lazy() without type annotations, which fails the
// typecheck under noImplicitAny (TS7022). Adds an explicit
// z.ZodTypeAny annotation to those consts.
// Runs as part of "generate:shopware-schemas" right after code generation.
import {readFileSync, writeFileSync} from "node:fs";

const file = new URL("../src/generated/shopware-schemas.ts", import.meta.url);
const source = readFileSync(file, "utf8");
writeFileSync(
    file,
    source
        .replaceAll("z.record(", "z.record(z.string(), ")
        .replace(/^const (\w+) = z\.lazy\(/gm, "const $1: z.ZodTypeAny = z.lazy("),
);
