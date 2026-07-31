#!/usr/bin/env node
// Shared OpenAPI spec reducer for actions in this monorepo.
//
// Usage:
//   node ../../scripts/openapi-filter.mjs <input-spec.(json|yaml)> <output.json> \
//        --roots <name,name,...> [--depth <n|infinity>] [--rename <old>=<new> ...]
//
// A full vendor OpenAPI spec is usually far larger than an action needs (e.g.
// Stripe's is ~10MB / ~1700 schemas). This reduces it to just the schemas an
// action exposes plus everything they reference, before conversion to zod:
//   - ROOTS are the resources the action actually exposes; always kept.
//   - Every schema reachable from a root within DEPTH `$ref` hops is also kept,
//     so nested objects resolve to real typed schemas instead of untyped
//     passthrough objects.
//   - Any `$ref` that reaches beyond that horizon is replaced with a permissive
//     untyped object, cutting the (often deeply circular) reference graph.
//
// DEPTH defaults to Infinity, keeping the entire transitive closure so nothing
// is stubbed. Lower it to trade completeness for a smaller generated file. The
// kept closure may be deeply circular; that is fine because openapi-to-zod.mjs
// emits every schema as a `z.lazy` named const.
//
// --rename gives an awkwardly-named component a stable identifier (e.g. Twilio's
// "api.v2010.account.message" -> "TwilioMessage"); the schema and every `$ref`
// to it are renamed before roots are resolved, so `--roots` uses the new name.
//
// YAML specs (.yaml/.yml) are supported; the parser (`yaml` or `js-yaml`) is
// loaded from the calling action's node_modules, so add one as a devDependency.
// Output is always JSON.
import {readFileSync, writeFileSync, mkdirSync} from "node:fs";
import {dirname, resolve, join} from "node:path";
import {createRequire} from "node:module";

const args = process.argv.slice(2);
const positional = [];
const options = {roots: [], depth: Infinity, renames: new Map(), collapseExpandable: false};

const parseRoots = (value) => (value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const parseRename = (value) => {
    const eq = (value ?? "").indexOf("=");
    if (eq <= 0) {
        console.error(`Invalid --rename "${value}" (expected <old>=<new>)`);
        process.exit(1);
    }
    options.renames.set(value.slice(0, eq).trim(), value.slice(eq + 1).trim());
};

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--roots") {
        options.roots = parseRoots(args[++i]);
    } else if (arg.startsWith("--roots=")) {
        options.roots = parseRoots(arg.slice("--roots=".length));
    } else if (arg === "--depth") {
        options.depth = parseDepth(args[++i]);
    } else if (arg.startsWith("--depth=")) {
        options.depth = parseDepth(arg.slice("--depth=".length));
    } else if (arg === "--rename") {
        parseRename(args[++i]);
    } else if (arg.startsWith("--rename=")) {
        parseRename(arg.slice("--rename=".length));
    } else {
        positional.push(arg);
    }
}

function parseDepth(value) {
    if (value === undefined || /^inf(inity)?$/i.test(value)) {
        return Infinity;
    }
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) {
        console.error(`Invalid --depth "${value}" (expected a non-negative integer or "infinity")`);
        process.exit(1);
    }
    return n;
}

const [inputArg, outputArg] = positional;
if (!inputArg || !outputArg || options.roots.length === 0) {
    console.error(
        "Usage: node openapi-filter.mjs <input-spec.json> <output.json> " +
        "--roots <name,name,...> [--depth <n|infinity>]",
    );
    process.exit(1);
}

const inputPath = resolve(process.cwd(), inputArg);
const outputPath = resolve(process.cwd(), outputArg);

const readSpec = (path) => {
    const text = readFileSync(path, "utf8");
    if (!/\.ya?ml$/i.test(path)) {
        return JSON.parse(text);
    }
    // Load a YAML parser from the calling action's node_modules.
    const require = createRequire(join(process.cwd(), "package.json"));
    let yaml;
    try {
        yaml = require("yaml");
    } catch {
        try {
            yaml = require("js-yaml");
        } catch {
            throw new Error(
                "Reading a YAML spec requires a YAML parser. Add \"yaml\" (or " +
                "\"js-yaml\") as a devDependency in the action.",
            );
        }
    }
    return yaml.parse ? yaml.parse(text) : yaml.load(text);
};

const spec = readSpec(inputPath);
const allSchemas = spec.components?.schemas;
if (!allSchemas) {
    console.error(`No components.schemas found in ${inputPath}`);
    process.exit(1);
}

// Apply --rename before resolving roots: rename the schema and every $ref to it.
if (options.renames.size > 0) {
    for (const [from, to] of options.renames) {
        if (!(from in allSchemas)) {
            throw new Error(`--rename source schema "${from}" not found in ${inputPath}`);
        }
        allSchemas[to] = allSchemas[from];
        delete allSchemas[from];
    }
    const rewriteRenamedRefs = (node) => {
        if (Array.isArray(node)) {
            node.forEach(rewriteRenamedRefs);
        } else if (node !== null && typeof node === "object") {
            if (typeof node.$ref === "string") {
                const match = node.$ref.match(/^#\/components\/schemas\/(.+)$/);
                if (match && options.renames.has(match[1])) {
                    node.$ref = `#/components/schemas/${options.renames.get(match[1])}`;
                }
            }
            for (const value of Object.values(node)) {
                rewriteRenamedRefs(value);
            }
        }
    };
    rewriteRenamedRefs(allSchemas);
}

for (const name of options.roots) {
    if (!(name in allSchemas)) {
        throw new Error(`Root schema "${name}" not found in ${inputPath}`);
    }
}

// Collect the schema names directly referenced by a node subtree.
const collectRefs = (node, acc) => {
    if (Array.isArray(node)) {
        node.forEach((n) => collectRefs(n, acc));
        return;
    }
    if (node !== null && typeof node === "object") {
        if (typeof node.$ref === "string") {
            const match = node.$ref.match(/^#\/components\/schemas\/(.+)$/);
            if (match) {
                acc.add(match[1]);
            }
        }
        for (const value of Object.values(node)) {
            collectRefs(value, acc);
        }
    }
};

// Breadth-first expansion from the roots up to the requested depth.
const keep = new Set(options.roots);
let frontier = new Set(options.roots);
for (let depth = 0; depth < options.depth && frontier.size > 0; depth++) {
    const next = new Set();
    for (const name of frontier) {
        const schema = allSchemas[name];
        if (!schema) {
            continue;
        }
        const refs = new Set();
        collectRefs(schema, refs);
        for (const ref of refs) {
            if (allSchemas[ref] && !keep.has(ref)) {
                keep.add(ref);
                next.add(ref);
            }
        }
    }
    frontier = next;
}

// Replace $refs pointing outside the kept set with an untyped object.
const stubForeignRefs = (node) => {
    if (Array.isArray(node)) {
        return node.map(stubForeignRefs);
    }
    if (node !== null && typeof node === "object") {
        const ref = node.$ref;
        if (typeof ref === "string") {
            const match = ref.match(/^#\/components\/schemas\/(.+)$/);
            if (match && !keep.has(match[1])) {
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
            [...keep].sort().map((name) => [name, stubForeignRefs(allSchemas[name])]),
        ),
    },
};

mkdirSync(dirname(outputPath), {recursive: true});
writeFileSync(outputPath, JSON.stringify(filtered, null, 2));
console.log(
    `Kept ${keep.size} of ${Object.keys(allSchemas).length} schemas ` +
    `(roots: ${options.roots.join(", ")}; depth: ${options.depth})`,
);
