import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubPullRequestReviewSchema = schemas["pull-request-review"]
export type GitHubPullRequestReview = z.infer<typeof GitHubPullRequestReviewSchema>

@Identifier("GITHUB_PULL_REQUEST_REVIEW")
@Name({ code: "en-US", content: "GitHub pull request review" })
@DisplayMessage({ code: "en-US", content: "GitHub pull request review" })
@Schema(GitHubPullRequestReviewSchema)
export class GitHubPullRequestReviewDataType {}
