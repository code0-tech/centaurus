import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequestReview, GitHubPullRequestReviewSchema } from "../../data_types/pullRequestReviews/githubPullRequestReview.js"
import { createGitHubClient, handleGitHubError, requestBody } from "../../helpers.js"

@Identifier("submitPullRequestReview")
@Signature(
    '(owner: string, repository: string, pullRequestNumber: number, reviewId: number, event: "APPROVE"|"REQUEST_CHANGES"|"COMMENT", body?: string): GITHUB_PULL_REQUEST_REVIEW'
)
@Name({ code: "en-US", content: "Submit pull request review" })
@DisplayMessage({ code: "en-US", content: "Submit GitHub pull request review" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Submits a pending pull request review." })
@Description({ code: "en-US", content: "Submits a GitHub pull request review." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "pullRequestNumber", name: [{ code: "en-US", content: "Pull request number" }], description: [{ code: "en-US", content: "Number of the pull request." }] })
@Parameter({ runtimeName: "reviewId", name: [{ code: "en-US", content: "Review ID" }], description: [{ code: "en-US", content: "Identifier of the review." }] })
@Parameter({
    runtimeName: "event",
    name: [{ code: "en-US", content: "Event" }],
    description: [{ code: "en-US", content: "Whether the review approves, requests changes, or only comments." }],
})
@Parameter({
    runtimeName: "body",
    name: [{ code: "en-US", content: "Body" }],
    description: [{ code: "en-US", content: "Text of the review." }],
    optional: true,
})
export class SubmitPullRequestReviewFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        pullRequestNumber: number,
        reviewId: number,
        event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT",
        body?: string
    ): Promise<GitHubPullRequestReview> {
        if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1)
            throw new RuntimeError("GITHUB_INVALID_PULL_REQUEST_NUMBER", "Pull request number must be a positive integer.")
        if (!Number.isInteger(reviewId) || reviewId < 1) throw new RuntimeError("GITHUB_INVALID_REVIEW_ID", "Review ID must be a positive integer.")

        try {
            const client = createGitHubClient(context)
            const response = await client.post(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullRequestNumber}/reviews/${reviewId}/events`,
                requestBody({ event, body })
            )
            return GitHubPullRequestReviewSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
