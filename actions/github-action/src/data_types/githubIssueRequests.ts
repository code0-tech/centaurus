import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"

export const GitHubCreateIssueRequestSchema = z.object({
    title: z.string().min(1),
    body: z.string().optional(),
    labels: z.array(z.string()).optional(),
    assignees: z.array(z.string()).optional(),
    milestone: z.int().positive().optional(),
})
export type GitHubCreateIssueRequest = z.infer<typeof GitHubCreateIssueRequestSchema>

export const GitHubUpdateIssueRequestSchema = z.object({
    title: z.string().min(1).optional(),
    body: z.string().nullable().optional(),
    state: z.enum(["open", "closed"]).optional(),
    state_reason: z.enum(["completed", "not_planned", "reopened"]).optional(),
    labels: z.array(z.string()).optional(),
    assignees: z.array(z.string()).optional(),
    milestone: z.int().positive().nullable().optional(),
})
export type GitHubUpdateIssueRequest = z.infer<typeof GitHubUpdateIssueRequestSchema>

@Identifier("GITHUB_CREATE_ISSUE_REQUEST")
@Name({ code: "en-US", content: "Create GitHub issue request" })
@DisplayMessage({ code: "en-US", content: "Create GitHub issue request" })
@Schema(GitHubCreateIssueRequestSchema)
export class GitHubCreateIssueRequestDataType {}

@Identifier("GITHUB_UPDATE_ISSUE_REQUEST")
@Name({ code: "en-US", content: "Update GitHub issue request" })
@DisplayMessage({ code: "en-US", content: "Update GitHub issue request" })
@Schema(GitHubUpdateIssueRequestSchema)
export class GitHubUpdateIssueRequestDataType {}
