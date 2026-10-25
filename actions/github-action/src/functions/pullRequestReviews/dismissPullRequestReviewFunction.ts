import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequestReview, GitHubPullRequestReviewSchema } from "../../data_types/pullRequestReviews/githubPullRequestReview.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("dismissPullRequestReview")
@Signature("(owner: string, repository: string, pullRequestNumber: number, reviewId: number, message: string): GITHUB_PULL_REQUEST_REVIEW")
@Name({ code: "en-US", content: "Dismiss pull request review" })
@DisplayMessage({ code: "en-US", content: "Dismiss GitHub pull request review" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Dismisses a pull request review." })
@Description({ code: "en-US", content: "Dismisses a GitHub pull request review." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "pullRequestNumber", name: [{ code: "en-US", content: "Pull request number" }], description: [{ code: "en-US", content: "Number of the pull request." }] })
@Parameter({ runtimeName: "reviewId", name: [{ code: "en-US", content: "Review ID" }], description: [{ code: "en-US", content: "Identifier of the review." }] })
@Parameter({ runtimeName: "message", name: [{ code: "en-US", content: "Message" }], description: [{ code: "en-US", content: "Reason the review is dismissed." }] })
export class DismissPullRequestReviewFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        pullRequestNumber: number,
        reviewId: number,
        message: string
    ): Promise<GitHubPullRequestReview> {
        if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1)
            throw new RuntimeError("GITHUB_INVALID_PULL_REQUEST_NUMBER", "Pull request number must be a positive integer.")
        if (!Number.isInteger(reviewId) || reviewId < 1) throw new RuntimeError("GITHUB_INVALID_REVIEW_ID", "Review ID must be a positive integer.")

        try {
            const client = createGitHubClient(context)
            const response = await client.put(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullRequestNumber}/reviews/${reviewId}/dismissals`,
                { message, event: "DISMISS" }
            )
            return GitHubPullRequestReviewSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
