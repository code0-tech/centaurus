import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubIssueComment, GitHubIssueCommentSchema } from "../../data_types/issueComments/githubIssueComment.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("createIssueComment")
@Signature("(owner: string, repository: string, issueNumber: number, body: string): GITHUB_ISSUE_COMMENT")
@Name({ code: "en-US", content: "Create issue comment" })
@DisplayMessage({ code: "en-US", content: "Create GitHub issue comment" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Creates a comment on an issue or pull request conversation." })
@Description({ code: "en-US", content: "Creates a GitHub issue comment." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "issueNumber", name: [{ code: "en-US", content: "Issue number" }], description: [{ code: "en-US", content: "Number of the issue." }] })
@Parameter({ runtimeName: "body", name: [{ code: "en-US", content: "Comment" }], description: [{ code: "en-US", content: "Text of the comment." }] })
export class CreateIssueCommentFunction {
    async run(context: FunctionContext, owner: string, repository: string, issueNumber: number, body: string): Promise<GitHubIssueComment> {
        if (!Number.isInteger(issueNumber) || issueNumber < 1) throw new RuntimeError("GITHUB_INVALID_ISSUE_NUMBER", "Issue number must be a positive integer.")

        try {
            const client = createGitHubClient(context)
            const response = await client.post(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}/comments`, { body })

            return GitHubIssueCommentSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
