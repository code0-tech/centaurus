import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequestReview, GitHubPullRequestReviewSchema } from "../../data_types/pullRequestReviews/githubPullRequestReview.js"
import { GitHubSubmitPullRequestReviewRequest } from "../../data_types/pullRequestReviews/githubPullRequestReviewRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("submitPullRequestReview")
@Signature(
    "(owner: string, repository: string, pullRequestNumber: number, reviewId: number, data: GITHUB_SUBMIT_PULL_REQUEST_REVIEW_REQUEST): GITHUB_PULL_REQUEST_REVIEW"
)
@Name({ code: "en-US", content: "Submit pull request review" })
@DisplayMessage({ code: "en-US", content: "Submit GitHub pull request review" })
@Documentation({ code: "en-US", content: "Submits a pending pull request review." })
@Description({ code: "en-US", content: "Submits a GitHub pull request review." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "pullRequestNumber", name: [{ code: "en-US", content: "Pull request number" }] })
@Parameter({ runtimeName: "reviewId", name: [{ code: "en-US", content: "Review ID" }] })
@Parameter({ runtimeName: "data", name: [{ code: "en-US", content: "Review submission" }] })
export class SubmitPullRequestReviewFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        pullRequestNumber: number,
        reviewId: number,
        data: GitHubSubmitPullRequestReviewRequest
    ): Promise<GitHubPullRequestReview> {
        if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1)
            throw new RuntimeError("GITHUB_INVALID_PULL_REQUEST_NUMBER", "Pull request number must be a positive integer.")
        if (!Number.isInteger(reviewId) || reviewId < 1) throw new RuntimeError("GITHUB_INVALID_REVIEW_ID", "Review ID must be a positive integer.")

        try {
            const client = createGitHubClient(context)
            const response = await client.post(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullRequestNumber}/reviews/${reviewId}/events`,
                data
            )
            return GitHubPullRequestReviewSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
