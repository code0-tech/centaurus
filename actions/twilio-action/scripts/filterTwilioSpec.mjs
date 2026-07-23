// Twilio's api v2010 spec (twilio_api_v2010.json) defines the entire 2010 API
// and is large and heavily cross-referenced. Only the Message resource schema
// is needed for the TWILIO_MESSAGE data type, so this script reduces the
// downloaded spec before code generation, mirroring filterShopwareSpec.mjs in
// shopware-action:
//   - keeps `api.v2010.account.message`, re-exposed under the stable name
//     `TwilioMessage` so the generated schema has a predictable identifier
//     regardless of how openapi-zod-client would sanitize the dotted name
//   - inlines $refs that point at scalar/enum components (e.g. the
//     `message_enum_direction` / `message_enum_status` string enums) so their
//     type and allowed values survive instead of collapsing to an empty object
//   - replaces every other ($ref to an object/array) component with a
//     permissive untyped object, cutting the rest of the graph
//   - drops `minLength` / `maxLength` / `pattern` string constraints: this is a
//     schema for *parsing Twilio responses*, so it stays lenient (Postel's law)
//     rather than rejecting a real response over an exact SID-format mismatch
// Runs as part of "generate:twilio-schemas" right after the download.
import {readFileSync, writeFileSync} from "node:fs";

const SOURCE_NAME = "api.v2010.account.message";
const TARGET_NAME = "TwilioMessage";

// String validation constraints stripped for lenient response parsing.
const DROPPED_VALIDATION_KEYS = new Set(["minLength", "maxLength", "pattern"]);

const input = new URL("../schemas/twilio-api-v2010-openapi.json", import.meta.url);
const output = new URL("../schemas/twilio-api-v2010-openapi.filtered.json", import.meta.url);

const spec = JSON.parse(readFileSync(input, "utf8"));
const allSchemas = spec.components?.schemas ?? {};

if (!(SOURCE_NAME in allSchemas)) {
    throw new Error(`Schema "${SOURCE_NAME}" not found in ${input}`);
}

// Rewrite $refs: self-references point at the renamed schema, references to
// scalar/enum components are inlined (so enum values survive), and every other
// (object/array) component reference is stubbed out as an untyped object.
const rewriteRefs = (node) => {
    if (Array.isArray(node)) {
        return node.map(rewriteRefs);
    }
    if (node !== null && typeof node === "object") {
        const ref = node.$ref;
        if (typeof ref === "string") {
            const match = ref.match(/^#\/components\/schemas\/(.+)$/);
            if (match) {
                if (match[1] === SOURCE_NAME) {
                    return {$ref: `#/components/schemas/${TARGET_NAME}`};
                }
                const target = allSchemas[match[1]];
                if (target && target.type && target.type !== "object" && target.type !== "array") {
                    return rewriteRefs(target);
                }
                return {type: "object", additionalProperties: true};
            }
        }
        return Object.fromEntries(
            Object.entries(node)
                .filter(([key]) => !DROPPED_VALIDATION_KEYS.has(key))
                .map(([key, value]) => [key, rewriteRefs(value)]),
        );
    }
    return node;
};

const filtered = {
    openapi: spec.openapi,
    info: spec.info,
    paths: {},
    components: {
        schemas: {
            [TARGET_NAME]: rewriteRefs(allSchemas[SOURCE_NAME]),
        },
    },
};

writeFileSync(output, JSON.stringify(filtered, null, 2));
console.log(`Kept "${SOURCE_NAME}" as "${TARGET_NAME}" (of ${Object.keys(allSchemas).length} schemas)`);
