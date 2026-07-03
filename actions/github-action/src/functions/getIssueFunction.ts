import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubIssue, GitHubIssueSchema } from "../data_types/githubIssue.js"
import { createGitHubClient, handleGitHubError } from "../helpers.js"

@Identifier("getIssue")
@Signature("(owner: string, repository: string, issueNumber: number): GITHUB_ISSUE")
@Name({ code: "en-US", content: "Get issue" })
@DisplayMessage({ code: "en-US", content: "Get GitHub issue" })
@Documentation({
    code: "en-US",
    content: "Returns a single issue from a GitHub repository by its repository-local issue number.",
})
@Description({
    code: "en-US",
    content: "Returns a single issue from a GitHub repository.",
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
export class GetIssueFunction {
    async run(context: FunctionContext, owner: string, repository: string, issueNumber: number): Promise<GitHubIssue> {
        if (!Number.isInteger(issueNumber) || issueNumber < 1) {
            throw new RuntimeError("GITHUB_INVALID_ISSUE_NUMBER", "Issue number must be a positive integer.")
        }

        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}`)

            return GitHubIssueSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
