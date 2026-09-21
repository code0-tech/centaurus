import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubPullRequestReviewSchema = z.looseObject({}) as unknown as z.ZodType<
    Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews"]["response"]["data"][number]
>
export type GitHubPullRequestReview = z.infer<typeof GitHubPullRequestReviewSchema>

@Identifier("GITHUB_PULL_REQUEST_REVIEW")
@Name({ code: "en-US", content: "GitHub pull request review" })
@DisplayMessage({ code: "en-US", content: "GitHub pull request review" })
@Schema(GitHubPullRequestReviewSchema)
export class GitHubPullRequestReviewDataType {}
