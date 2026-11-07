/**
 * Drops every `undefined` from a value, at any depth.
 *
 * Hercules turns what a runtime function returns - and every argument of a sub flow
 * call - into a protobuf value, and that serializer has no representation for
 * `undefined`: it throws `Unsupported value type: undefined` and the whole execution
 * fails with an unhelpful UNKNOWN_ERROR. Provider payloads carry such keys routinely
 * (an unset `system_fingerprint`, a tool call without an error, token details a model
 * did not report), so anything a model or an API produced has to be cleaned before it
 * crosses that boundary. A key whose value is undefined is left out entirely, which
 * is what an optional field in our schemas means anyway.
 */
export function stripUndefined<T>(value: T): T {
    if (Array.isArray(value)) {
        // An entry dropped from a list would shift every later index, so an
        // undefined entry becomes null instead of disappearing.
        return value.map((entry: unknown) => (entry === undefined ? null : stripUndefined(entry))) as T;
    }

    if (typeof value === "object" && value !== null) {
        const cleaned: Record<string, unknown> = {};
        for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
            if (entry !== undefined) cleaned[key] = stripUndefined(entry);
        }
        return cleaned as T;
    }

    return value;
}
