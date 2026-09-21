import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubIssueComment, GitHubIssueCommentSchema } from "../../data_types/issueComments/githubIssueComment.js"
import { GitHubUpdateIssueCommentRequest } from "../../data_types/issueComments/githubIssueCommentRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("updateIssueComment")
@Signature("(owner: string, repository: string, commentId: number, data: GITHUB_UPDATE_ISSUE_COMMENT_REQUEST): GITHUB_ISSUE_COMMENT")
@Name({ code: "en-US", content: "Update issue comment" })
@DisplayMessage({ code: "en-US", content: "Update GitHub issue comment" })
@Documentation({ code: "en-US", content: "Updates an issue comment." })
@Description({ code: "en-US", content: "Updates a GitHub issue comment." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "commentId", name: [{ code: "en-US", content: "Comment ID" }] })
@Parameter({ runtimeName: "data", name: [{ code: "en-US", content: "Comment updates" }] })
export class UpdateIssueCommentFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        commentId: number,
        data: GitHubUpdateIssueCommentRequest
    ): Promise<GitHubIssueComment> {
        if (!Number.isInteger(commentId) || commentId < 1) throw new RuntimeError("GITHUB_INVALID_COMMENT_ID", "Comment ID must be a positive integer.")

        try {
            const client = createGitHubClient(context)
            const response = await client.patch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/comments/${commentId}`, data)

            return GitHubIssueCommentSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
