import type { ToolCall } from "../../types/middleware/Approval.types.js";

/**
 * How a call is written into a question and recognised in it. The arguments are part
 * of it: an approved refund of one order says nothing about another.
 */
export const describeCall = (call: ToolCall): string => `${call.name}(${JSON.stringify(call.args ?? {})})`;
