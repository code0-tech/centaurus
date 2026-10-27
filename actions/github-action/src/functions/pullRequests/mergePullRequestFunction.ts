import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequestMergeResult, GitHubPullRequestMergeResultSchema } from "../../data_types/pullRequests/githubPullRequestMergeResult.js"
import { createGitHubClient, handleGitHubError, requestBody } from "../../helpers.js"

@Identifier("mergePullRequest")
@Signature(
    '(owner: string, repository: string, pullRequestNumber: number, mergeMethod?: "merge"|"squash"|"rebase", commitTitle?: string, commitMessage?: string, sha?: string): GITHUB_PULL_REQUEST_MERGE_RESULT'
)
@Name({ code: "en-US", content: "Merge pull request" })
@DisplayMessage({ code: "en-US", content: "Merge GitHub pull request" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Merges a GitHub pull request." })
@Description({ code: "en-US", content: "Merges a GitHub pull request." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "pullRequestNumber", name: [{ code: "en-US", content: "Pull request number" }], description: [{ code: "en-US", content: "Number of the pull request." }] })
@Parameter({
    runtimeName: "mergeMethod",
    name: [{ code: "en-US", content: "Merge method" }],
    description: [{ code: "en-US", content: "How the pull request is merged." }],
    optional: true,
})
@Parameter({
    runtimeName: "commitTitle",
    name: [{ code: "en-US", content: "Commit title" }],
    description: [{ code: "en-US", content: "Title of the merge commit." }],
    optional: true,
})
@Parameter({
    runtimeName: "commitMessage",
    name: [{ code: "en-US", content: "Commit message" }],
    description: [{ code: "en-US", content: "Message appended to the merge commit." }],
    optional: true,
})
@Parameter({
    runtimeName: "sha",
    name: [{ code: "en-US", content: "Expected SHA" }],
    description: [{ code: "en-US", content: "SHA the source branch must point at for the merge to run." }],
    optional: true,
})
export class MergePullRequestFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        pullRequestNumber: number,
        mergeMethod?: "merge" | "squash" | "rebase",
        commitTitle?: string,
        commitMessage?: string,
        sha?: string
    ): Promise<GitHubPullRequestMergeResult> {
        if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1)
            throw new RuntimeError("GITHUB_INVALID_PULL_REQUEST_NUMBER", "Pull request number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.put(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullRequestNumber}/merge`,
                requestBody({ merge_method: mergeMethod, commit_title: commitTitle, commit_message: commitMessage, sha })
            )
            return GitHubPullRequestMergeResultSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
