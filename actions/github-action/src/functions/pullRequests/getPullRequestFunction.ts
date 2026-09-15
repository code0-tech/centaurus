import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequest, GitHubPullRequestSchema } from "../../data_types/pullRequests/githubPullRequest.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getPullRequest")
@Signature("(owner: string, repository: string, pullRequestNumber: number): GITHUB_PULL_REQUEST")
@Name({ code: "en-US", content: "Get pull request" })
@DisplayMessage({ code: "en-US", content: "Get GitHub pull request" })
@Documentation({
    code: "en-US",
    content: "Returns a single pull request from a GitHub repository by its repository-local number.",
})
@Description({
    code: "en-US",
    content: "Returns a single pull request from a GitHub repository.",
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
    runtimeName: "pullRequestNumber",
    name: [{ code: "en-US", content: "Pull request number" }],
    description: [
        {
            code: "en-US",
            content: "Repository-local pull request number.",
        },
    ],
})
export class GetPullRequestFunction {
    async run(context: FunctionContext, owner: string, repository: string, pullRequestNumber: number): Promise<GitHubPullRequest> {
        if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1) {
            throw new RuntimeError("GITHUB_INVALID_PULL_REQUEST_NUMBER", "Pull request number must be a positive integer.")
        }

        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullRequestNumber}`)

            return GitHubPullRequestSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
