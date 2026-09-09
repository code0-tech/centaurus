import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequest, GitHubPullRequestSchema } from "../../data_types/pullRequests/githubPullRequest.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("reopenPullRequest")
@Signature("(owner: string, repository: string, pullRequestNumber: number): GITHUB_PULL_REQUEST")
@Name({ code: "en-US", content: "Reopen pull request" })
@DisplayMessage({ code: "en-US", content: "Reopen GitHub pull request" })
@Documentation({ code: "en-US", content: "Reopens a GitHub pull request." })
@Description({ code: "en-US", content: "Reopens a GitHub pull request." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "pullRequestNumber", name: [{ code: "en-US", content: "Pull request number" }] })
export class ReopenPullRequestFunction {
    async run(context: FunctionContext, owner: string, repository: string, pullRequestNumber: number): Promise<GitHubPullRequest> {
        if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1)
            throw new RuntimeError("GITHUB_INVALID_PULL_REQUEST_NUMBER", "Pull request number must be a positive integer.")

        try {
            const client = createGitHubClient(context)
            const response = await client.patch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullRequestNumber}`, {
                state: "open",
            })
            return GitHubPullRequestSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
