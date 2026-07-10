import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import {
    GitHubPullRequestMergeRequest,
    GitHubPullRequestMergeResult,
    GitHubPullRequestMergeResultSchema,
} from "../../data_types/pullRequests/githubPullRequestMergeRequest.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("mergePullRequest")
@Signature("(owner: string, repository: string, pullRequestNumber: number, data?: GITHUB_PULL_REQUEST_MERGE_REQUEST): GITHUB_PULL_REQUEST_MERGE_RESULT")
@Name({ code: "en-US", content: "Merge pull request" })
@DisplayMessage({ code: "en-US", content: "Merge GitHub pull request" })
@Documentation({ code: "en-US", content: "Merges a GitHub pull request." })
@Description({ code: "en-US", content: "Merges a GitHub pull request." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "pullRequestNumber", name: [{ code: "en-US", content: "Pull request number" }] })
export class MergePullRequestFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        pullRequestNumber: number,
        data: GitHubPullRequestMergeRequest = {}
    ): Promise<GitHubPullRequestMergeResult> {
        if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1)
            throw new RuntimeError("GITHUB_INVALID_PULL_REQUEST_NUMBER", "Pull request number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.put(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullRequestNumber}/merge`, data)
            return GitHubPullRequestMergeResultSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
