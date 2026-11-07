import { LOG_LEVELS, type LogLevel, type WritingLevel } from "../../types/shared/Log.types.js";
import { describeValue } from "./Log.describeValue.util.js";

/**
 * Writes one line, if a line of this level is written at all.
 *
 * How much is logged comes from `AI_LOG_LEVEL`: `debug` by default so a run can be
 * followed end to end while the action is being tried out, and off under vitest,
 * where the lines would bury the test output. Set `AI_LOG_LEVEL=off` to silence it,
 * or `AI_LOG_LEVEL=debug` in a test run to see everything.
 */
export function emit(
    level: WritingLevel,
    scope: string,
    correlation: string | undefined,
    message: string,
    details?: unknown,
): void {
    const configured: string | undefined = process.env.AI_LOG_LEVEL?.trim().toLowerCase();
    const wanted: LogLevel =
        configured && (LOG_LEVELS as readonly string[]).includes(configured)
            ? (configured as LogLevel)
            : process.env.VITEST || process.env.NODE_ENV === "test"
              ? "off"
              : "debug";
    if (LOG_LEVELS.indexOf(level) < LOG_LEVELS.indexOf(wanted)) return;

    const line: string = [
        new Date().toISOString(),
        level.toUpperCase().padEnd(5),
        `[ai${scope ? `:${scope}` : ""}]${correlation ? ` (${correlation})` : ""}`,
        message,
    ].join(" ");

    const write = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    if (details === undefined) write(line);
    else write(`${line} ${describeValue(details)}`);
}
