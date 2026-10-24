import { RuntimeError } from "@code0-tech/hercules";

export function requireText(value: unknown, errorCode: string, problem: string): string {
    if (typeof value === "string" && value.trim().length > 0) return value;
    throw new RuntimeError(errorCode, problem);
}
