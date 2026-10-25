import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubPullRequestReviewCommentSchema = schemas["pull-request-review-comment"]
export type GitHubPullRequestReviewComment = z.infer<typeof GitHubPullRequestReviewCommentSchema>

@Identifier("GITHUB_PULL_REQUEST_REVIEW_COMMENT")
@Name({ code: "en-US", content: "GitHub pull request review comment" })
@DisplayMessage({ code: "en-US", content: "GitHub pull request review comment" })
@Schema(GitHubPullRequestReviewCommentSchema)
export class GitHubPullRequestReviewCommentDataType {}
