import type { ToolCall } from "../../types/middleware/Approval.types.js";
import { APPROVE, DECLINE } from "./Approval.markers.util.js";
import { describeCall } from "./Approval.describeCall.util.js";

/**
 * The question an agent answers with instead of running the calls: what it wants to
 * do, and the two answers that decide about it.
 *
 * The code belongs to this one question, so an approval cannot be reused for a later
 * call and an answer copied out of an older message cannot release a new one.
 */
export const askFor = (calls: ToolCall[], code: string): string =>
    [...calls.map(describeCall), "", `${APPROVE} ${code}`, `${DECLINE} ${code}`].join("\n");
