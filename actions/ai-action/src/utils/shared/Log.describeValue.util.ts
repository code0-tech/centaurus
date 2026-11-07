/** Keys whose value never reaches a log line, wherever they sit in a payload. */
const SECRETS = /^(api[-_]?key|authorization|auth|token|password|secret|[a-z]+[-_]?api[-_]?key)$/i;
const REDACTED = "[redacted]";
const MAX_VALUE_CHARS = 2000;

/**
 * A value as a log line: secrets dropped, long values cut, cycles survived.
 *
 * Everything logged goes through here, so no line can carry an API key, a payload
 * cannot bury the rest of a run, and a value that refers to itself does not throw
 * where it is only meant to be described.
 */
export function describeValue(value: unknown): string {
    const seen = new WeakSet<object>();
    const text: string =
        JSON.stringify(value, (key: string, entry: unknown): unknown => {
            if (SECRETS.test(key)) return REDACTED;
            if (typeof entry === "bigint") return `${entry}`;
            if (typeof entry === "function") return "[function]";
            if (typeof entry === "object" && entry !== null) {
                if (seen.has(entry)) return "[circular]";
                seen.add(entry);
            }
            return entry;
        }) ?? String(value);

    return text.length > MAX_VALUE_CHARS ? `${text.slice(0, MAX_VALUE_CHARS)}…(${text.length} chars)` : text;
}
