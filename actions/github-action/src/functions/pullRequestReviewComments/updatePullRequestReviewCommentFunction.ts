import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequestReviewComment, GitHubPullRequestReviewCommentSchema } from "../../data_types/pullRequestReviewComments/githubPullRequestReviewComment.js"
import { GitHubUpdatePullRequestReviewCommentRequest } from "../../data_types/pullRequestReviewComments/githubPullRequestReviewCommentRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("updatePullRequestReviewComment")
@Signature(
    "(owner: string, repository: string, commentId: number, data: GITHUB_UPDATE_PULL_REQUEST_REVIEW_COMMENT_REQUEST): GITHUB_PULL_REQUEST_REVIEW_COMMENT"
)
@Name({ code: "en-US", content: "Update pull request review comment" })
@DisplayMessage({ code: "en-US", content: "Update GitHub pull request review comment" })
@Documentation({ code: "en-US", content: "Updates a pull request review comment." })
@Description({ code: "en-US", content: "Updates a GitHub pull request review comment." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "commentId", name: [{ code: "en-US", content: "Comment ID" }] })
@Parameter({ runtimeName: "data", name: [{ code: "en-US", content: "Review comment updates" }] })
export class UpdatePullRequestReviewCommentFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        commentId: number,
        data: GitHubUpdatePullRequestReviewCommentRequest
    ): Promise<GitHubPullRequestReviewComment> {
        if (!Number.isInteger(commentId) || commentId < 1) throw new RuntimeError("GITHUB_INVALID_COMMENT_ID", "Comment ID must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.patch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/comments/${commentId}`, data)
            return GitHubPullRequestReviewCommentSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
