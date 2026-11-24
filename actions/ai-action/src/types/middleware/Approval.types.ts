/** A tool call, as the parts of the approval exchange pass it around. */
export interface ToolCall {
    name: string;
    args?: Record<string, unknown>;
}

/** What a reply did to a question, as far as matching can tell. */
export type ApprovalDecision = "approved" | "declined" | "open" | "spent";

/** A question of a conversation, with where it sits and what became of it. */
export interface OpenQuestion {
    /** Its position in the conversation, which is where it gets marked as used. */
    at: number;
    text: string;
    code: string;
    decision: ApprovalDecision;
}
