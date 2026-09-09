import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("deletePullRequestReviewComment")
@Signature("(owner: string, repository: string, commentId: number): void")
@Name({ code: "en-US", content: "Delete pull request review comment" })
@DisplayMessage({ code: "en-US", content: "Delete GitHub pull request review comment" })
@Documentation({ code: "en-US", content: "Deletes a pull request review comment." })
@Description({ code: "en-US", content: "Deletes a GitHub pull request review comment." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "commentId", name: [{ code: "en-US", content: "Comment ID" }] })
export class DeletePullRequestReviewCommentFunction {
    async run(context: FunctionContext, owner: string, repository: string, commentId: number): Promise<void> {
        if (!Number.isInteger(commentId) || commentId < 1) throw new RuntimeError("GITHUB_INVALID_COMMENT_ID", "Comment ID must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            await client.delete(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/comments/${commentId}`)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
