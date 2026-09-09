import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubIssue, GitHubIssueSchema } from "../../data_types/issues/githubIssue.js"
import { GitHubUpdateIssueRequest } from "../../data_types/issues/githubIssueRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("updateIssue")
@Signature("(owner: string, repository: string, issueNumber: number, data: GITHUB_UPDATE_ISSUE_REQUEST): GITHUB_ISSUE")
@Name({ code: "en-US", content: "Update issue" })
@DisplayMessage({ code: "en-US", content: "Update GitHub issue" })
@Documentation({
    code: "en-US",
    content: "Updates or closes an issue in a GitHub repository.",
})
@Description({
    code: "en-US",
    content: "Updates an issue in a GitHub repository.",
})
@Parameter({
    runtimeName: "owner",
    name: [{ code: "en-US", content: "Owner" }],
    description: [{ code: "en-US", content: "Repository owner or organization." }],
})
@Parameter({
    runtimeName: "repository",
    name: [{ code: "en-US", content: "Repository" }],
    description: [{ code: "en-US", content: "Repository name." }],
})
@Parameter({
    runtimeName: "issueNumber",
    name: [{ code: "en-US", content: "Issue number" }],
    description: [{ code: "en-US", content: "Repository-local issue number." }],
})
@Parameter({
    runtimeName: "data",
    name: [{ code: "en-US", content: "Issue updates" }],
    description: [{ code: "en-US", content: "Issue fields to update." }],
})
export class UpdateIssueFunction {
    async run(context: FunctionContext, owner: string, repository: string, issueNumber: number, data: GitHubUpdateIssueRequest): Promise<GitHubIssue> {
        if (!Number.isInteger(issueNumber) || issueNumber < 1) {
            throw new RuntimeError("GITHUB_INVALID_ISSUE_NUMBER", "Issue number must be a positive integer.")
        }

        try {
            const client = createGitHubClient(context)
            const response = await client.patch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}`, data)

            return GitHubIssueSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
