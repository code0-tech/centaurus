import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubCreateIssueCommentRequestSchema = z.object({
    body: z.string().min(1),
}) as unknown as z.ZodType<Omit<Endpoints["POST /repos/{owner}/{repo}/issues/{issue_number}/comments"]["parameters"], "owner" | "repo" | "issue_number">>
export type GitHubCreateIssueCommentRequest = z.infer<typeof GitHubCreateIssueCommentRequestSchema>

export const GitHubUpdateIssueCommentRequestSchema = z.object({
    body: z.string().min(1),
}) as unknown as z.ZodType<Omit<Endpoints["PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}"]["parameters"], "owner" | "repo" | "comment_id">>
export type GitHubUpdateIssueCommentRequest = z.infer<typeof GitHubUpdateIssueCommentRequestSchema>

@Identifier("GITHUB_CREATE_ISSUE_COMMENT_REQUEST")
@Name({ code: "en-US", content: "Create GitHub issue comment request" })
@DisplayMessage({ code: "en-US", content: "Create GitHub issue comment request" })
@Schema(GitHubCreateIssueCommentRequestSchema)
export class GitHubCreateIssueCommentRequestDataType {}

@Identifier("GITHUB_UPDATE_ISSUE_COMMENT_REQUEST")
@Name({ code: "en-US", content: "Update GitHub issue comment request" })
@DisplayMessage({ code: "en-US", content: "Update GitHub issue comment request" })
@Schema(GitHubUpdateIssueCommentRequestSchema)
export class GitHubUpdateIssueCommentRequestDataType {}
