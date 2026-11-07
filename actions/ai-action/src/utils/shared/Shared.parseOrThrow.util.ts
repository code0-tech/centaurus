import { RuntimeError } from "@code0-tech/hercules";
import type { ZodType } from "zod";
import { formatIssues } from "./Shared.formatIssues.util.js";

export function parseOrThrow<T>(schema: ZodType<T>, value: unknown, errorCode: string, problem: string): T {
    const parsed = schema.safeParse(value);
    if (parsed.success) return parsed.data;
    throw new RuntimeError(errorCode, `${problem}: ${formatIssues(parsed.error.issues)}`);
}
