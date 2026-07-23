// The full Stripe OpenAPI spec (spec3.sdk.json, ~6MB, several hundred
// schemas) is far too large and cross-referenced for openapi-zod-client to
// process directly. Only a handful of resource schemas are needed for the
// v1 action (functions + webhook payloads), so this script reduces the
// downloaded spec before code generation:
//   - keeps the resource schemas we actually expose fully typed
//   - replaces $refs to any other schema with a permissive untyped object,
//     cutting the (deeply circular and expandable) reference graph
// This is acceptable here because the action only reads top-level fields of
// these objects; expanded/nested associations are represented as untyped
// objects. Runs as part of "generate:stripe-schemas" right after download.
import {readFileSync, writeFileSync} from "node:fs";

// Stripe component schema names are lowercase snake_case (e.g. "payment_intent").
const KEEP_SCHEMAS = new Set([
    "customer",
    "payment_intent",
    "refund",
    "charge",
]);

const input = new URL("../schemas/stripe-openapi.json", import.meta.url);
const output = new URL("../schemas/stripe-openapi.filtered.json", import.meta.url);

const spec = JSON.parse(readFileSync(input, "utf8"));
const allSchemas = spec.components.schemas;

for (const name of KEEP_SCHEMAS) {
    if (!(name in allSchemas)) {
        throw new Error(`Schema "${name}" not found in ${input}`);
    }
}

// Replace $refs pointing outside KEEP_SCHEMAS with an untyped object.
const stubForeignRefs = (node) => {
    if (Array.isArray(node)) {
        return node.map(stubForeignRefs);
    }
    if (node !== null && typeof node === "object") {
        const ref = node.$ref;
        if (typeof ref === "string") {
            const match = ref.match(/^#\/components\/schemas\/(.+)$/);
            if (match && !KEEP_SCHEMAS.has(match[1])) {
                return {type: "object", additionalProperties: true};
            }
        }
        return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, stubForeignRefs(value)]));
    }
    return node;
};

const filtered = {
    openapi: spec.openapi,
    info: spec.info,
    paths: {},
    components: {
        schemas: Object.fromEntries(
            [...KEEP_SCHEMAS].sort().map((name) => [name, stubForeignRefs(allSchemas[name])]),
        ),
    },
};

writeFileSync(output, JSON.stringify(filtered, null, 2));
console.log(`Kept ${KEEP_SCHEMAS.size} of ${Object.keys(allSchemas).length} schemas: ${[...KEEP_SCHEMAS].sort().join(", ")}`);
