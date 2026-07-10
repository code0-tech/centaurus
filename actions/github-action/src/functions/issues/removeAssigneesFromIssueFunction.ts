import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubIssue, GitHubIssueSchema } from "../../data_types/issues/githubIssue.js"
import { GitHubAddAssigneesRequest } from "../../data_types/issues/githubAssigneesRequest.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("removeAssigneesFromIssue")
@Signature("(owner: string, repository: string, issueNumber: number, data: GITHUB_ADD_ASSIGNEES_REQUEST): GITHUB_ISSUE")
@Name({ code: "en-US", content: "Remove assignees from issue" })
@DisplayMessage({ code: "en-US", content: "Remove GitHub issue assignees" })
@Documentation({ code: "en-US", content: "Removes assignees from a GitHub issue." })
@Description({ code: "en-US", content: "Removes assignees from a GitHub issue." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "issueNumber", name: [{ code: "en-US", content: "Issue number" }] })
@Parameter({ runtimeName: "data", name: [{ code: "en-US", content: "Assignees" }] })
export class RemoveAssigneesFromIssueFunction {
    async run(context: FunctionContext, owner: string, repository: string, issueNumber: number, data: GitHubAddAssigneesRequest): Promise<GitHubIssue> {
        if (!Number.isInteger(issueNumber) || issueNumber < 1) throw new RuntimeError("GITHUB_INVALID_ISSUE_NUMBER", "Issue number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.delete(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}/assignees`, {
                data,
            })
            return GitHubIssueSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
