import {Action, Identifier, Name, Schema} from "@code0-tech/hercules";
import {recursiveSchemaNames, schemas} from "../generated/shopware-schemas.ts";

/**
 * Shopware's admin object graph is deeply recursive: an order references its
 * sales channel, a sales channel references its orders, a product references
 * categories whose CMS pages reference media that belongs back to a product,
 * and so on. Hercules turns every data type's schema into a flat TypeScript
 * type string and cannot inline a schema that (transitively) contains itself —
 * so every schema participating in such a cycle has to be registered as its own
 * data type and referenced by identifier instead of being expanded in place.
 *
 * scripts/openapi-to-zod.mjs already detects these via strongly-connected-
 * component analysis and emits them as `recursiveSchemaNames`. Registering one
 * data type per name here (rather than hand-writing ~115 files) keeps the set in
 * sync automatically whenever the schemas are regenerated.
 *
 * The order-related resources a user actually works with get curated
 * identifiers and names from their own files and are skipped here to avoid
 * registering them twice.
 */
const CURATED_SCHEMA_NAMES = new Set<string>([
    "Order",
    "OrderDelivery",
    "OrderDeliveryPosition",
    "OrderLineItem",
    "OrderLineItemDownload",
    "OrderTransaction",
    "OrderTransactionCapture",
    "OrderTransactionCaptureRefund",
    "OrderTransactionCaptureRefundPosition",
    "OrderCustomer",
    "OrderAddress",
    "StateMachineState",
    "Salutation",
    "Currency",
    "Country",
    "CountryState",
]);

// Data type identifiers are capped at 50 characters by Hercules. Shopware's
// component names are short enough today (the longest, `Shopware` +
// `ProductCrossSellingAssignedProducts`, is 43), but the spec grows with every
// Shopware release, so any over-long identifier is truncated and given a stable
// hash suffix derived from the full schema name. The hash keeps the identifier
// unique and deterministic across regenerations; short names are left untouched
// so they stay readable.
const MAX_IDENTIFIER_LENGTH = 50;

const fnv1aHex = (input: string): string => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0").toUpperCase();
};

// Matches the curated data types, which are all named `Shopware<SchemaName>`.
const toIdentifier = (schemaName: string): string => {
    const full = `Shopware${schemaName.replace(/[^a-zA-Z0-9]/g, "")}`;
    if (full.length <= MAX_IDENTIFIER_LENGTH) {
        return full;
    }
    const suffix = `_${fnv1aHex(schemaName)}`;
    return full.slice(0, MAX_IDENTIFIER_LENGTH - suffix.length) + suffix;
};

export function registerGeneratedRecursiveDataTypes(action: Action): void {
    for (const schemaName of recursiveSchemaNames) {
        if (CURATED_SCHEMA_NAMES.has(schemaName)) {
            continue;
        }
        const schema = schemas[schemaName as keyof typeof schemas];
        const dataType = class {};
        const identifier = toIdentifier(schemaName);
        Identifier(identifier)(dataType);
        Name({code: "en-US", content: identifier})(dataType);
        Schema(schema)(dataType);
        action.registerDataTypeClass(dataType);
    }
}
