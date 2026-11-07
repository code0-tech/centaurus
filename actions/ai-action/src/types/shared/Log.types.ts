/** How much is written, from the quietest to everything. */
export const LOG_LEVELS = ["debug", "info", "warn", "error", "off"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/** A level that actually writes, which is every one but `off`. */
export type WritingLevel = Exclude<LogLevel, "off">;

export interface Logger {
    debug: (message: string, details?: unknown) => void;
    info: (message: string, details?: unknown) => void;
    warn: (message: string, details?: unknown) => void;
    error: (message: string, details?: unknown) => void;
    /** A logger of the same scope, with something to tie lines of one run together. */
    child: (correlation: string) => Logger;
}
