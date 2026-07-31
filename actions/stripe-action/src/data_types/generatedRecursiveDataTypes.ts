import {Action, Identifier, Name, Schema} from "@code0-tech/hercules";
import {recursiveSchemaNames, schemas} from "../generated/stripe-schemas.ts";

/**
 * Stripe's object graph is deeply recursive: a customer references its
 * subscriptions, a subscription references its customer, a charge references a
 * balance transaction whose source can be a charge, and so on. Hercules turns
 * every data type's schema into a flat TypeScript type string and cannot inline
 * a schema that (transitively) contains itself — so every schema participating
 * in such a cycle has to be registered as its own data type and referenced by
 * identifier instead of being expanded in place.
 *
 * scripts/openapi-to-zod.mjs already detects these via strongly-connected-
 * component analysis and emits them as `recursiveSchemaNames`. Registering one
 * data type per name here (rather than hand-writing ~100 files) keeps the set in
 * sync automatically whenever the schemas are regenerated.
 *
 * The top-level resources a user actually works with (customer, payment intent,
 * refund) get curated identifiers, names and display messages from their own
 * files and are skipped here to avoid registering them twice.
 */
const CURATED_SCHEMA_NAMES = new Set<string>(["customer", "payment_intent", "refund"]);

// Data type identifiers are capped at 50 characters by Hercules. Some of
// Stripe's deeply nested schema names (e.g.
// `customer_balance_resource_cash_balance_transaction_resource_unapplied_from_payment_transaction`)
// blow past that once prefixed, so any over-long identifier is truncated and
// given a stable hash suffix derived from the full schema name. The hash keeps
// the identifier unique and deterministic across regenerations; short names are
// left untouched so they stay readable.
const MAX_IDENTIFIER_LENGTH = 50;

const fnv1aHex = (input: string): string => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0").toUpperCase();
};

const toIdentifier = (schemaName: string): string => {
    const full = `STRIPE_${schemaName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;
    if (full.length <= MAX_IDENTIFIER_LENGTH) {
        return full;
    }
    const suffix = `_${fnv1aHex(schemaName)}`;
    return full.slice(0, MAX_IDENTIFIER_LENGTH - suffix.length) + suffix;
};

const toName = (schemaName: string): string =>
    `Stripe ${schemaName.replace(/[._]/g, " ")}`;

export function registerGeneratedRecursiveDataTypes(action: Action): void {
    for (const schemaName of recursiveSchemaNames) {
        if (CURATED_SCHEMA_NAMES.has(schemaName)) {
            continue;
        }
        const schema = schemas[schemaName as keyof typeof schemas];
        const dataType = class {};
        Identifier(toIdentifier(schemaName))(dataType);
        Name({code: "en-US", content: toName(schemaName)})(dataType);
        Schema(schema)(dataType);
        action.registerDataTypeClass(dataType);
    }
}
