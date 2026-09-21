import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubCreatePullRequestReviewCommentRequestSchema = z.looseObject({
    body: z.string().min(1),
}) as unknown as z.ZodType<Omit<Endpoints["POST /repos/{owner}/{repo}/pulls/{pull_number}/comments"]["parameters"], "owner" | "repo" | "pull_number">>
export type GitHubCreatePullRequestReviewCommentRequest = z.infer<typeof GitHubCreatePullRequestReviewCommentRequestSchema>

export const GitHubUpdatePullRequestReviewCommentRequestSchema = z.object({
    body: z.string().min(1),
}) as unknown as z.ZodType<Omit<Endpoints["PATCH /repos/{owner}/{repo}/pulls/comments/{comment_id}"]["parameters"], "owner" | "repo" | "comment_id">>
export type GitHubUpdatePullRequestReviewCommentRequest = z.infer<typeof GitHubUpdatePullRequestReviewCommentRequestSchema>

@Identifier("GITHUB_CREATE_PULL_REQUEST_REVIEW_COMMENT_REQUEST")
@Name({ code: "en-US", content: "Create GitHub pull request review comment request" })
@DisplayMessage({ code: "en-US", content: "Create GitHub pull request review comment request" })
@Schema(GitHubCreatePullRequestReviewCommentRequestSchema)
export class GitHubCreatePullRequestReviewCommentRequestDataType {}

@Identifier("GITHUB_UPDATE_PULL_REQUEST_REVIEW_COMMENT_REQUEST")
@Name({ code: "en-US", content: "Update GitHub pull request review comment request" })
@DisplayMessage({ code: "en-US", content: "Update GitHub pull request review comment request" })
@Schema(GitHubUpdatePullRequestReviewCommentRequestSchema)
export class GitHubUpdatePullRequestReviewCommentRequestDataType {}
