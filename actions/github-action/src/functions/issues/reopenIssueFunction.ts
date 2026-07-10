import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubIssue, GitHubIssueSchema } from "../../data_types/issues/githubIssue.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("reopenIssue")
@Signature("(owner: string, repository: string, issueNumber: number): GITHUB_ISSUE")
@Name({ code: "en-US", content: "Reopen issue" })
@DisplayMessage({ code: "en-US", content: "Reopen GitHub issue" })
@Documentation({ code: "en-US", content: "Reopens a GitHub issue." })
@Description({ code: "en-US", content: "Reopens a GitHub issue." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "issueNumber", name: [{ code: "en-US", content: "Issue number" }] })
export class ReopenIssueFunction {
    async run(context: FunctionContext, owner: string, repository: string, issueNumber: number): Promise<GitHubIssue> {
        if (!Number.isInteger(issueNumber) || issueNumber < 1) throw new RuntimeError("GITHUB_INVALID_ISSUE_NUMBER", "Issue number must be a positive integer.")

        try {
            const client = createGitHubClient(context)
            const response = await client.patch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}`, {
                state: "open",
            })
            return GitHubIssueSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
