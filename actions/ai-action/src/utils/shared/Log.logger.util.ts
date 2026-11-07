import type { Logger } from "../../types/shared/Log.types.js";
import { emit } from "./Log.emit.util.js";

/**
 * The action's logging, scoped by what it is about (`openai`, `agent`, `model`).
 *
 * Every line goes through here rather than to `console` directly, so one environment
 * variable turns the whole run quiet or loud, and so nothing logs an API key.
 */
export function logger(scope: string, correlation?: string): Logger {
    return {
        debug: (message, details) => emit("debug", scope, correlation, message, details),
        info: (message, details) => emit("info", scope, correlation, message, details),
        warn: (message, details) => emit("warn", scope, correlation, message, details),
        error: (message, details) => emit("error", scope, correlation, message, details),
        child: (next: string) => logger(scope, next),
    };
}
