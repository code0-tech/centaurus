import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequest, GitHubPullRequestSchema } from "../data_types/githubPullRequest.js"
import { GitHubUpdatePullRequestRequest } from "../data_types/githubPullRequestRequests.js"
import { createGitHubClient, handleGitHubError } from "../helpers.js"

@Identifier("updatePullRequest")
@Signature("(owner: string, repository: string, pullRequestNumber: number, data: GITHUB_UPDATE_PULL_REQUEST_REQUEST): GITHUB_PULL_REQUEST")
@Name({ code: "en-US", content: "Update pull request" })
@DisplayMessage({ code: "en-US", content: "Update GitHub pull request" })
@Documentation({
    code: "en-US",
    content: "Updates or closes a pull request in a GitHub repository.",
})
@Description({
    code: "en-US",
    content: "Updates a pull request in a GitHub repository.",
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
    description: [{ code: "en-US", content: "Repository-local pull request number." }],
})
@Parameter({
    runtimeName: "data",
    name: [{ code: "en-US", content: "Pull request updates" }],
    description: [{ code: "en-US", content: "Pull request fields to update." }],
})
export class UpdatePullRequestFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        pullRequestNumber: number,
        data: GitHubUpdatePullRequestRequest
    ): Promise<GitHubPullRequest> {
        if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1) {
            throw new RuntimeError("GITHUB_INVALID_PULL_REQUEST_NUMBER", "Pull request number must be a positive integer.")
        }

        try {
            const client = createGitHubClient(context)
            const response = await client.patch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullRequestNumber}`, data)

            return GitHubPullRequestSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
