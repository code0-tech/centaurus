import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequestReview, GitHubPullRequestReviewSchema } from "../../data_types/pullRequestReviews/githubPullRequestReview.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getPullRequestReviews")
@Signature("(owner: string, repository: string, pullRequestNumber: number, page?: number, perPage?: number): GITHUB_PULL_REQUEST_REVIEW[]")
@Name({ code: "en-US", content: "Get pull request reviews" })
@DisplayMessage({ code: "en-US", content: "Get GitHub pull request reviews" })
@Documentation({ code: "en-US", content: "Returns reviews for a pull request." })
@Description({ code: "en-US", content: "Returns GitHub pull request reviews." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "pullRequestNumber", name: [{ code: "en-US", content: "Pull request number" }] })
export class GetPullRequestReviewsFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        pullRequestNumber: number,
        page = 1,
        perPage = 30
    ): Promise<GitHubPullRequestReview[]> {
        if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1)
            throw new RuntimeError("GITHUB_INVALID_PULL_REQUEST_NUMBER", "Pull request number must be a positive integer.")
        if (!Number.isInteger(page) || page < 1) throw new RuntimeError("GITHUB_INVALID_PAGE", "Page must be a positive integer.")
        if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100)
            throw new RuntimeError("GITHUB_INVALID_PER_PAGE", "Results per page must be an integer from 1 to 100.")

        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullRequestNumber}/reviews`, {
                params: { page, per_page: perPage },
            })
            return GitHubPullRequestReviewSchema.array().parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
