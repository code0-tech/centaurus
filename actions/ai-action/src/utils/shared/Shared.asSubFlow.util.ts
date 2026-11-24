import { RuntimeError, type SubFlow } from "@code0-tech/hercules";
import { isSubFlow } from "./Shared.isSubFlow.util.js";

export function asSubFlow(value: unknown, parameter: string): SubFlow {
    if (isSubFlow(value)) return value;
    throw new RuntimeError(
        "ERROR_INVALID_AI_SUB_FLOW",
        `The "${parameter}" parameter has to be a sub flow, but a ${typeof value} was passed.`,
    );
}
