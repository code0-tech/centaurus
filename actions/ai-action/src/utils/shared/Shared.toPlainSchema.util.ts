import { fromProtoValue } from "./Shared.fromProtoValue.util.js";

/**
 * The sub flow's schema as plain JSON, or undefined when it declared none.
 *
 * A sub flow's `inputSchema` arrives as the raw protobuf `shared.Struct` - hercules
 * hands the message through untouched - so every value is still wrapped in its `kind`
 * oneof. Reading a JSON schema off that directly yields nothing: it has to be
 * unwrapped back into plain JSON first. A schema that is already plain is passed
 * through, so this holds either way.
 */
export function toPlainSchema(value: unknown): Record<string, unknown> | undefined {
    if (typeof value !== "object" || value === null) return undefined;

    const fields = (value as { fields?: unknown }).fields;
    if (typeof fields === "object" && fields !== null) {
        const entries: [string, unknown][] = Object.entries(fields as Record<string, unknown>);
        // A `Struct` is told apart from a plain schema by its wrapped field values.
        const isStruct: boolean =
            entries.length === 0 ||
            entries.some(
                ([, entry]) =>
                    typeof (entry as { kind?: { oneofKind?: unknown } })?.kind === "object" &&
                    typeof (entry as { kind: { oneofKind?: unknown } }).kind?.oneofKind === "string",
            );

        if (isStruct) {
            return Object.fromEntries(entries.map(([key, field]) => [key, fromProtoValue(field)]));
        }
    }

    return value as Record<string, unknown>;
}
