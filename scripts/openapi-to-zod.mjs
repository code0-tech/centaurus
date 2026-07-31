#!/usr/bin/env node
// Shared OpenAPI -> zod schema generator for actions in this monorepo.
//
// Usage:
//   node ../../scripts/openapi-to-zod.mjs <input-spec.json> <output.ts>
//
// Converts every schema under `components.schemas` of an OpenAPI document into
// a zod schema. Each schema becomes a named const wrapped in `z.lazy(() => ...)`
// and every `$ref` becomes a reference to that const. Lazy evaluation makes
// declaration order irrelevant and resolves circular references the same way a
// hand-written recursive zod schema would, so nothing is inlined and memory
// stays O(number of schemas). This is why we do not use openapi-zod-client: it
// expands the (often deeply circular) reference graph in a single pass and can
// run out of heap on large specs such as Stripe's.
//
// Nested objects therefore become real typed structures rather than untyped
// passthrough objects. The only remaining "open" values are fields the spec
// itself leaves shapeless (an object with no declared properties); those become
// `z.record(z.string(), z.any())` — a typed arbitrary object, never an empty
// `z.object({}).passthrough()`.
//
// The generator aims to handle every type-affecting construct of the OpenAPI
// 3.0 / 3.1 Schema Object: $ref, type (incl. "null" and type arrays), enum,
// const, allOf (intersection), anyOf/oneOf (union), not (permissive), object
// shapes (properties/required/additionalProperties/patternProperties) and array
// shapes (items, tuple items/prefixItems). Value constraints (maxLength,
// pattern, minimum, ...) and annotations (title, description, format, ...) are
// recognized but intentionally NOT enforced: they never change the TypeScript
// type and enforcing them would risk rejecting otherwise-valid payloads. Any
// keyword that is neither handled nor explicitly ignored throws, so a spec that
// introduces a new construct fails generation loudly instead of silently
// emitting a wrong schema.
import {readFileSync, mkdirSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";

const [, , inputArg, outputArg] = process.argv;
if (!inputArg || !outputArg) {
    console.error("Usage: node openapi-to-zod.mjs <input-spec.json> <output.ts>");
    process.exit(1);
}

const inputPath = resolve(process.cwd(), inputArg);
const outputPath = resolve(process.cwd(), outputArg);

const spec = JSON.parse(readFileSync(inputPath, "utf8"));
const schemas = spec.components?.schemas;
if (!schemas || typeof schemas !== "object") {
    console.error(`No components.schemas found in ${inputPath}`);
    process.exit(1);
}

// Keywords we understand. Anything else (that is not an `x-` extension) throws.
// Handled = affects the emitted type. Ignored = recognized but does not change
// the type, so it is safely skipped (constraints/validation and annotations).
const HANDLED_KEYWORDS = new Set([
    "$ref", "type", "enum", "const",
    "allOf", "anyOf", "oneOf", "not",
    "properties", "required", "additionalProperties", "patternProperties",
    "items", "prefixItems", "nullable",
]);
const IGNORED_KEYWORDS = new Set([
    // annotations
    "title", "description", "default", "example", "examples",
    "deprecated", "readOnly", "writeOnly", "format", "discriminator",
    "xml", "externalDocs", "$comment", "$id", "$schema", "$anchor",
    // string constraints
    "minLength", "maxLength", "pattern", "contentEncoding", "contentMediaType",
    // numeric constraints
    "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf",
    // array constraints
    "minItems", "maxItems", "uniqueItems", "contains", "minContains", "maxContains",
    // object constraints
    "minProperties", "maxProperties", "propertyNames",
    "dependentRequired", "dependentSchemas", "unevaluatedProperties",
]);

// Component names may contain characters invalid in JS identifiers
// (e.g. "billing.credit_grant", "test_helpers.test_clock").
const ident = (name) => name.replace(/[^a-zA-Z0-9_$]/g, "_");

const refName = (ref) => {
    const match = ref.match(/^#\/components\/schemas\/(.+)$/);
    if (!match) {
        throw new Error(`Unsupported $ref (only #/components/schemas/* is supported): ${ref}`);
    }
    if (!(match[1] in schemas)) {
        throw new Error(`Dangling $ref to unknown schema: ${ref}`);
    }
    return ident(match[1]);
};

const lit = (value) => JSON.stringify(value);

const literalExpr = (value) => (value === null ? "z.null()" : `z.literal(${lit(value)})`);

const union = (members) => (members.length === 1 ? members[0] : `z.union([${members.join(", ")}])`);

const intersection = (members) =>
    members.reduce((acc, next) => (acc ? `z.intersection(${acc}, ${next})` : next), "");

const enumExpr = (values) => {
    const nonNull = values.filter((v) => v !== null);
    if (nonNull.length === 0) {
        return "z.null()";
    }
    if (nonNull.every((v) => typeof v === "string")) {
        return nonNull.length === 1
            ? `z.literal(${lit(nonNull[0])})`
            : `z.enum([${nonNull.map(lit).join(", ")}])`;
    }
    return union(nonNull.map(literalExpr));
};

const isNullable = (node) =>
    node.nullable === true ||
    (Array.isArray(node.type) && node.type.includes("null")) ||
    (Array.isArray(node.enum) && node.enum.includes(null));

// Reject unknown keywords so new spec constructs surface at generation time.
const assertKnown = (node) => {
    for (const key of Object.keys(node)) {
        if (key.startsWith("x-")) {
            continue;
        }
        if (!HANDLED_KEYWORDS.has(key) && !IGNORED_KEYWORDS.has(key)) {
            throw new Error(
                `Unsupported OpenAPI schema keyword "${key}". Add handling for it ` +
                `in scripts/openapi-to-zod.mjs before regenerating.`,
            );
        }
    }
};

const typeName = (type) => {
    switch (type) {
        case "null": return "z.null()";
        case "string": return "z.string()";
        case "integer": return "z.number().int()";
        case "number": return "z.number()";
        case "boolean": return "z.boolean()";
        default: return null; // "object" / "array" handled by shape helpers
    }
};

const arrayExpr = (node) => {
    if (Array.isArray(node.prefixItems) || Array.isArray(node.items)) {
        const tuple = (node.prefixItems || node.items).map(toZod);
        return `z.tuple([${tuple.join(", ")}])`;
    }
    return `z.array(${node.items === undefined ? "z.any()" : toZod(node.items)})`;
};

const objectExpr = (node) => {
    const properties = node.properties;
    const required = new Set(node.required || []);
    const additional = node.additionalProperties;
    const pattern = node.patternProperties;

    const openValue = () => {
        if (additional && typeof additional === "object") {
            return toZod(additional);
        }
        if (pattern) {
            return union(Object.values(pattern).map(toZod));
        }
        return "z.any()";
    };

    if (properties && Object.keys(properties).length > 0) {
        const entries = Object.entries(properties).map(([key, value]) => {
            const inner = toZod(value);
            return `${lit(key)}: ${required.has(key) ? inner : `${inner}.optional()`}`;
        });
        const object = `z.object({${entries.join(", ")}})`;
        if (additional === false) {
            return `${object}.strict()`;
        }
        if ((additional && typeof additional === "object") || pattern) {
            return `${object}.catchall(${openValue()})`;
        }
        return `${object}.passthrough()`; // allow unknown extra keys
    }

    // No declared properties: a typed map or a shapeless open object.
    if ((additional && typeof additional === "object") || pattern) {
        return `z.record(z.string(), ${openValue()})`;
    }
    if (additional === false) {
        return "z.object({}).strict()";
    }
    return "z.record(z.string(), z.any())";
};

// Expression derived purely from `type` / object / array shape.
const localTypeExpr = (node) => {
    const type = node.type;
    if (Array.isArray(type)) {
        const members = type
            .filter((t) => t !== "null")
            .map((t) => (t === "object" ? objectExpr(node) : t === "array" ? arrayExpr(node) : typeName(t)))
            .filter(Boolean);
        return members.length ? union(members) : "z.null()";
    }
    if (type === "object") {
        return objectExpr(node);
    }
    if (type === "array") {
        return arrayExpr(node);
    }
    const named = type === undefined ? null : typeName(type);
    if (named) {
        return named;
    }
    // No explicit type: infer from shape keywords, else fully open.
    if (node.properties || node.additionalProperties !== undefined || node.patternProperties) {
        return objectExpr(node);
    }
    if (node.items !== undefined || node.prefixItems !== undefined) {
        return arrayExpr(node);
    }
    return "z.any()";
};

// Core expression for a node, before nullability is applied.
const coreExpr = (node) => {
    if (node.allOf) {
        const members = node.allOf.map(toZod);
        // allOf may also carry local constraints alongside the composed schemas.
        const hasLocalShape =
            node.properties || node.items || node.additionalProperties !== undefined ||
            (node.type && node.type !== "object" && node.type !== "array");
        if (hasLocalShape) {
            members.push(localTypeExpr(node));
        }
        return intersection(members);
    }
    if (node.anyOf) {
        return union(node.anyOf.map(toZod));
    }
    if (node.oneOf) {
        return union(node.oneOf.map(toZod));
    }
    if (typeof node.$ref === "string") {
        return refName(node.$ref);
    }
    if ("const" in node) {
        return literalExpr(node.const);
    }
    if (node.enum) {
        return enumExpr(node.enum);
    }
    // `not` alone cannot be expressed in zod; treated as unconstrained.
    return localTypeExpr(node);
};

function toZod(node) {
    if (node === true || node === undefined) {
        return "z.any()";
    }
    if (node === false) {
        return "z.never()";
    }
    if (typeof node !== "object" || Array.isArray(node)) {
        return "z.any()";
    }
    assertKnown(node);
    let expr = coreExpr(node);
    if (isNullable(node) && expr !== "z.null()") {
        expr = `${expr}.nullable()`;
    }
    return expr;
}

// Names of schemas that reference themselves directly or via a cycle, computed
// with Tarjan's strongly-connected-components algorithm (iterative, to avoid
// deep recursion on large specs). A schema is recursive if it is in an SCC of
// size > 1, or references itself directly.
function findRecursiveSchemas(allSchemas) {
    const nodes = Object.keys(allSchemas);
    const edges = new Map();
    const selfLoop = new Set();
    for (const name of nodes) {
        const refs = new Set();
        const collect = (node) => {
            if (Array.isArray(node)) {
                node.forEach(collect);
            } else if (node && typeof node === "object") {
                if (typeof node.$ref === "string") {
                    const match = node.$ref.match(/^#\/components\/schemas\/(.+)$/);
                    if (match && match[1] in allSchemas) {
                        refs.add(match[1]);
                    }
                }
                for (const value of Object.values(node)) {
                    collect(value);
                }
            }
        };
        collect(allSchemas[name]);
        if (refs.has(name)) {
            selfLoop.add(name);
        }
        edges.set(name, [...refs]);
    }

    const index = new Map();
    const low = new Map();
    const onStack = new Set();
    const stack = [];
    const recursive = new Set(selfLoop);
    let counter = 0;

    for (const start of nodes) {
        if (index.has(start)) {
            continue;
        }
        // Iterative DFS: each work item tracks the next successor to visit.
        const work = [{node: start, i: 0}];
        while (work.length > 0) {
            const frame = work[work.length - 1];
            const {node} = frame;
            if (frame.i === 0) {
                index.set(node, counter);
                low.set(node, counter);
                counter++;
                stack.push(node);
                onStack.add(node);
            }
            const succ = edges.get(node);
            if (frame.i < succ.length) {
                const next = succ[frame.i++];
                if (!index.has(next)) {
                    work.push({node: next, i: 0});
                } else if (onStack.has(next)) {
                    low.set(node, Math.min(low.get(node), index.get(next)));
                }
                continue;
            }
            // Done with node: if it is an SCC root, pop its component.
            if (low.get(node) === index.get(node)) {
                const component = [];
                let member;
                do {
                    member = stack.pop();
                    onStack.delete(member);
                    component.push(member);
                } while (member !== node);
                if (component.length > 1) {
                    for (const m of component) {
                        recursive.add(m);
                    }
                }
            }
            work.pop();
            if (work.length > 0) {
                const parent = work[work.length - 1].node;
                low.set(parent, Math.min(low.get(parent), low.get(node)));
            }
        }
    }
    return recursive;
}

const names = Object.keys(schemas).sort();
const lines = [
    "// AUTO-GENERATED by scripts/openapi-to-zod.mjs. Do not edit by hand.",
    "// Regenerate with the action's `generate:*-schemas` npm script.",
    'import {z} from "zod";',
    "",
];

// Determine which schemas participate in a reference cycle. Every const is
// wrapped in `z.lazy` (so declaration order never matters), but only recursive
// consts get an explicit `: z.ZodTypeAny` annotation — without it TypeScript
// fails on circular consts (TS7022). Non-recursive consts are left un-annotated
// so their output type is inferred and `.parse()` returns a concrete type
// instead of `unknown`.
const recursive = findRecursiveSchemas(schemas);

for (const name of names) {
    const annotation = recursive.has(name) ? ": z.ZodTypeAny" : "";
    lines.push(`const ${ident(name)}${annotation} = z.lazy(() => ${toZod(schemas[name])});`);
}

lines.push("");
lines.push("export const schemas = {");
for (const name of names) {
    const id = ident(name);
    lines.push(id === name ? `  ${id},` : `  ${lit(name)}: ${id},`);
}
lines.push("};");
lines.push("");

// Names of schemas that reference themselves directly or through a cycle. A
// recursive schema cannot be inlined into a flat TypeScript type string, so a
// consumer that needs a type per schema (e.g. hercules data types) must register
// each of these on its own so it can be referenced by identifier instead. Listed
// here so consumers stay in sync automatically across regenerations.
const recursiveNames = names.filter((name) => recursive.has(name));
lines.push("export const recursiveSchemaNames = [");
for (const name of recursiveNames) {
    lines.push(`  ${lit(name)},`);
}
lines.push("] as const;");
lines.push("");

mkdirSync(dirname(outputPath), {recursive: true});
writeFileSync(outputPath, lines.join("\n"));
console.log(`Generated ${names.length} zod schemas -> ${outputArg}`);
