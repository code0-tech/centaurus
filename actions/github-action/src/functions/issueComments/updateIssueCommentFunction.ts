import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubIssueComment, GitHubIssueCommentSchema } from "../../data_types/issueComments/githubIssueComment.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("updateIssueComment")
@Signature("(owner: string, repository: string, commentId: number, body: string): GITHUB_ISSUE_COMMENT")
@Name({ code: "en-US", content: "Update issue comment" })
@DisplayMessage({ code: "en-US", content: "Update GitHub issue comment" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Updates an issue comment." })
@Description({ code: "en-US", content: "Updates a GitHub issue comment." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "commentId", name: [{ code: "en-US", content: "Comment ID" }], description: [{ code: "en-US", content: "Identifier of the comment." }] })
@Parameter({ runtimeName: "body", name: [{ code: "en-US", content: "Comment" }], description: [{ code: "en-US", content: "New text of the comment." }] })
export class UpdateIssueCommentFunction {
    async run(context: FunctionContext, owner: string, repository: string, commentId: number, body: string): Promise<GitHubIssueComment> {
        if (!Number.isInteger(commentId) || commentId < 1) throw new RuntimeError("GITHUB_INVALID_COMMENT_ID", "Comment ID must be a positive integer.")

        try {
            const client = createGitHubClient(context)
            const response = await client.patch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/comments/${commentId}`, { body })

            return GitHubIssueCommentSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
