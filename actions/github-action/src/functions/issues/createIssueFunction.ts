import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubIssue, GitHubIssueSchema } from "../../data_types/issues/githubIssue.js"
import { GitHubCreateIssueRequest } from "../../data_types/issues/githubIssueRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("createIssue")
@Signature("(owner: string, repository: string, data: GITHUB_CREATE_ISSUE_REQUEST): GITHUB_ISSUE")
@Name({ code: "en-US", content: "Create issue" })
@DisplayMessage({ code: "en-US", content: "Create GitHub issue" })
@Documentation({
    code: "en-US",
    content: "Creates an issue in a GitHub repository.",
})
@Description({
    code: "en-US",
    content: "Creates an issue in a GitHub repository.",
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
    runtimeName: "data",
    name: [{ code: "en-US", content: "Issue" }],
    description: [{ code: "en-US", content: "Issue fields to create." }],
})
export class CreateIssueFunction {
    async run(context: FunctionContext, owner: string, repository: string, data: GitHubCreateIssueRequest): Promise<GitHubIssue> {
        try {
            const client = createGitHubClient(context)
            const response = await client.post(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues`, data)

            return GitHubIssueSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
