import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubPullRequestReviewCommentSchema = z.looseObject({}) as unknown as z.ZodType<
    Endpoints["GET /repos/{owner}/{repo}/pulls/comments/{comment_id}"]["response"]["data"]
>
export type GitHubPullRequestReviewComment = z.infer<typeof GitHubPullRequestReviewCommentSchema>

@Identifier("GITHUB_PULL_REQUEST_REVIEW_COMMENT")
@Name({ code: "en-US", content: "GitHub pull request review comment" })
@DisplayMessage({ code: "en-US", content: "GitHub pull request review comment" })
@Schema(GitHubPullRequestReviewCommentSchema)
export class GitHubPullRequestReviewCommentDataType {}
