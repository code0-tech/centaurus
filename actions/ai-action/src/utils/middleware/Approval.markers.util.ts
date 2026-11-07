/**
 * The three markers the approval exchange writes and reads, and the whole of its
 * language.
 *
 * A question carries no sentence: a flow may be answered in any language, and an
 * agent's own words would have to be matched to be trusted. So the message is the
 * calls plus the two words that decide, and the marker lines are what identifies it
 * again - nothing here has to be read by a person to work.
 */
export const APPROVE = "APPROVE";
export const DECLINE = "DECLINE";

/** Marks a question as answered, so no second call can lean on it. */
export const DECIDED = "DECIDED";

/** The shape of a question's code, which is what ties an answer to one question. */
export const CODE = "[0-9a-f]{4,12}";
