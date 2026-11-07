import { APPROVE, CODE } from "./Approval.markers.util.js";

/**
 * The code a question was asked under, read out of its own marker line.
 *
 * A message is a question by that line alone, not by any wording - which is what lets
 * the exchange work in a flow of any language.
 */
export const codeOf = (text: string): string | undefined =>
    new RegExp(`^${APPROVE} (${CODE})$`, "m").exec(text)?.[1];
