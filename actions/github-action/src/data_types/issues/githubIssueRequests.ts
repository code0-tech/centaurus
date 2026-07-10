import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubCreateIssueRequestSchema = z.object({
    title: z.string().min(1),
    body: z.string().optional(),
    labels: z.array(z.string()).optional(),
    assignees: z.array(z.string()).optional(),
    milestone: z.int().positive().optional(),
}) as unknown as z.ZodType<Omit<Endpoints["POST /repos/{owner}/{repo}/issues"]["parameters"], "owner" | "repo">>
export type GitHubCreateIssueRequest = z.infer<typeof GitHubCreateIssueRequestSchema>

export const GitHubUpdateIssueRequestSchema = z.object({
    title: z.string().min(1).optional(),
    body: z.string().nullable().optional(),
    state: z.enum(["open", "closed"]).optional(),
    state_reason: z.enum(["completed", "not_planned", "reopened"]).optional(),
    labels: z.array(z.string()).optional(),
    assignees: z.array(z.string()).optional(),
    milestone: z.int().positive().nullable().optional(),
}) as unknown as z.ZodType<Omit<Endpoints["PATCH /repos/{owner}/{repo}/issues/{issue_number}"]["parameters"], "owner" | "repo" | "issue_number">>
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
