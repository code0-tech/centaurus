import type { SubFlow } from "@code0-tech/hercules";

export function isSubFlow(value: unknown): value is SubFlow {
    return typeof value === "function";
}
