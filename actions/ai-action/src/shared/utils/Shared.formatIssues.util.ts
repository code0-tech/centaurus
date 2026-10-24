import type { $ZodIssue } from "zod/v4/core";

export function formatIssues(issues: readonly $ZodIssue[]): string {
    return issues.map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`).join("; ");
}
