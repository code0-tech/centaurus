// The full Shopware Admin API spec (adminapi.json, ~4MB, 409 schemas)
// is so heavily cross-referenced and circular that openapi-zod-client
// runs out of memory on it. Since only the Order entity schema is
// needed for the webhook payloads, this script reduces the downloaded
// spec before code generation:
//   - keeps the Order entity family and the leaf entities that matter
//     for order handling (addresses, states, currency) fully typed
//   - replaces $refs to any other entity with a permissive untyped
//     object, cutting the circular graph
// This is acceptable for webhook payloads because Shopware business
// events do not guarantee complete associations anyway (see
// guides/plugins/apps/lifecycle/webhook.md in shopware/docs).
// Runs as part of "generate:shopware-schemas" right after the download.
import {readFileSync, writeFileSync} from "node:fs";

const KEEP_SCHEMAS = new Set([
    "Order",
    "OrderAddress",
    "OrderCustomer",
    "OrderDelivery",
    "OrderDeliveryPosition",
    "OrderLineItem",
    "OrderLineItemDownload",
    "OrderTransaction",
    "OrderTransactionCapture",
    "OrderTransactionCaptureRefund",
    "OrderTransactionCaptureRefundPosition",
    "StateMachineState",
    "Currency",
    "Country",
    "CountryState",
    "Salutation",
]);

const input = new URL("../schemas/shopware-admin-openapi.json", import.meta.url);
const output = new URL("../schemas/shopware-admin-openapi.filtered.json", import.meta.url);

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
