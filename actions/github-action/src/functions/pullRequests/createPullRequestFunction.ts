import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubPullRequest, GitHubPullRequestSchema } from "../../data_types/githubPullRequest.js"
import { GitHubCreatePullRequestRequest } from "../../data_types/githubPullRequestRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("createPullRequest")
@Signature("(owner: string, repository: string, data: GITHUB_CREATE_PULL_REQUEST_REQUEST): GITHUB_PULL_REQUEST")
@Name({ code: "en-US", content: "Create pull request" })
@DisplayMessage({ code: "en-US", content: "Create GitHub pull request" })
@Documentation({
    code: "en-US",
    content: "Creates a pull request between two existing branches.",
})
@Description({
    code: "en-US",
    content: "Creates a pull request in a GitHub repository.",
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
    name: [{ code: "en-US", content: "Pull request" }],
    description: [{ code: "en-US", content: "Pull request fields, including the head and base branches." }],
})
export class CreatePullRequestFunction {
    async run(context: FunctionContext, owner: string, repository: string, data: GitHubCreatePullRequestRequest): Promise<GitHubPullRequest> {
        try {
            const client = createGitHubClient(context)
            const response = await client.post(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls`, data)

            return GitHubPullRequestSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
