import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequestReviewComment, GitHubPullRequestReviewCommentSchema } from "../../data_types/pullRequestReviewComments/githubPullRequestReviewComment.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("updatePullRequestReviewComment")
@Signature("(owner: string, repository: string, commentId: number, body: string): GITHUB_PULL_REQUEST_REVIEW_COMMENT")
@Name({ code: "en-US", content: "Update pull request review comment" })
@DisplayMessage({ code: "en-US", content: "Update GitHub pull request review comment" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Updates a pull request review comment." })
@Description({ code: "en-US", content: "Updates a GitHub pull request review comment." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "commentId", name: [{ code: "en-US", content: "Comment ID" }], description: [{ code: "en-US", content: "Identifier of the comment." }] })
@Parameter({ runtimeName: "body", name: [{ code: "en-US", content: "Comment" }], description: [{ code: "en-US", content: "New text of the review comment." }] })
export class UpdatePullRequestReviewCommentFunction {
    async run(context: FunctionContext, owner: string, repository: string, commentId: number, body: string): Promise<GitHubPullRequestReviewComment> {
        if (!Number.isInteger(commentId) || commentId < 1) throw new RuntimeError("GITHUB_INVALID_COMMENT_ID", "Comment ID must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.patch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/comments/${commentId}`, { body })
            return GitHubPullRequestReviewCommentSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
