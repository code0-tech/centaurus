import { RuntimeError } from "@code0-tech/hercules";

export function asList(value: unknown, parameter: string): unknown[] {
    if (value === undefined || value === null) return [];
    if (Array.isArray(value)) return value;
    throw new RuntimeError(
        "ERROR_INVALID_AI_SUB_FLOW",
        `The "${parameter}" parameter has to be a list, but a ${typeof value} was passed.`,
    );
}
