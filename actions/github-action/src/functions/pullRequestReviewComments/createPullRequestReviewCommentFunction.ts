import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequestReviewComment, GitHubPullRequestReviewCommentSchema } from "../../data_types/pullRequestReviewComments/githubPullRequestReviewComment.js"
import { GitHubCreatePullRequestReviewCommentRequest } from "../../data_types/pullRequestReviewComments/githubPullRequestReviewCommentRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("createPullRequestReviewComment")
@Signature(
    "(owner: string, repository: string, pullRequestNumber: number, data: GITHUB_CREATE_PULL_REQUEST_REVIEW_COMMENT_REQUEST): GITHUB_PULL_REQUEST_REVIEW_COMMENT"
)
@Name({ code: "en-US", content: "Create pull request review comment" })
@DisplayMessage({ code: "en-US", content: "Create GitHub pull request review comment" })
@Documentation({ code: "en-US", content: "Creates a pull request review comment." })
@Description({ code: "en-US", content: "Creates a GitHub pull request review comment." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "pullRequestNumber", name: [{ code: "en-US", content: "Pull request number" }] })
@Parameter({ runtimeName: "data", name: [{ code: "en-US", content: "Review comment" }] })
export class CreatePullRequestReviewCommentFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        pullRequestNumber: number,
        data: GitHubCreatePullRequestReviewCommentRequest
    ): Promise<GitHubPullRequestReviewComment> {
        if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1)
            throw new RuntimeError("GITHUB_INVALID_PULL_REQUEST_NUMBER", "Pull request number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.post(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullRequestNumber}/comments`,
                data
            )
            return GitHubPullRequestReviewCommentSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
