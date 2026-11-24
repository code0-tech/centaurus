import type { ProtoStruct } from "../../types/shared/Proto.types.js";

/**
 * One wrapped protobuf value as the plain JSON it stands for.
 *
 * It has a single caller and still stands on its own: a struct nests, so unwrapping
 * one needs a function that can call itself, which no call site can do inline.
 */
export function fromProtoValue(value: unknown): unknown {
    const kind = (value as { kind?: { oneofKind?: string } })?.kind;
    if (!kind?.oneofKind) return null;

    const wrapped: unknown = (kind as Record<string, unknown>)[kind.oneofKind];

    switch (kind.oneofKind) {
        case "stringValue":
        case "boolValue":
            return wrapped;
        case "numberValue": {
            const number = (wrapped as { number?: { oneofKind?: string } })?.number;
            if (!number?.oneofKind) return null;
            // An int64 reaches us as a bigint, which JSON cannot carry.
            return Number((number as Record<string, unknown>)[number.oneofKind]);
        }
        case "structValue":
            return Object.fromEntries(
                Object.entries((wrapped as ProtoStruct).fields).map(([key, field]) => [key, fromProtoValue(field)]),
            );
        case "listValue":
            return ((wrapped as { values?: unknown[] })?.values ?? []).map(fromProtoValue);
        default:
            return null;
    }
}
