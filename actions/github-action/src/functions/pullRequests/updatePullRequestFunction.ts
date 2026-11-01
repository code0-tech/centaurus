import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequest, GitHubPullRequestSchema } from "../../data_types/pullRequests/githubPullRequest.js"
import { createGitHubClient, handleGitHubError, requestBody } from "../../helpers.js"

@Identifier("updatePullRequest")
@Signature(
    '(owner: string, repository: string, pullRequestNumber: number, title?: string, body?: string, state?: "open"|"closed", base?: string, maintainerCanModify?: boolean): GITHUB_PULL_REQUEST'
)
@Name({ code: "en-US", content: "Update pull request" })
@DisplayMessage({ code: "en-US", content: "Update GitHub pull request" })
@DisplayIcon("tabler:brand-github")
@Documentation({
    code: "en-US",
    content: "Updates or closes a pull request in a GitHub repository. Fields that are left empty keep their current value.",
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
    runtimeName: "title",
    name: [{ code: "en-US", content: "Title" }],
    description: [{ code: "en-US", content: "New title of the pull request." }],
    optional: true,
})
@Parameter({
    runtimeName: "body",
    name: [{ code: "en-US", content: "Body" }],
    description: [{ code: "en-US", content: "New description of the pull request." }],
    optional: true,
})
@Parameter({
    runtimeName: "state",
    name: [{ code: "en-US", content: "State" }],
    description: [{ code: "en-US", content: "Whether the pull request is open or closed." }],
    optional: true,
})
@Parameter({
    runtimeName: "base",
    name: [{ code: "en-US", content: "Target branch" }],
    description: [{ code: "en-US", content: "Branch the changes are merged into." }],
    optional: true,
})
@Parameter({
    runtimeName: "maintainerCanModify",
    name: [{ code: "en-US", content: "Maintainers can modify" }],
    description: [{ code: "en-US", content: "Whether maintainers may push to the source branch." }],
    optional: true,
})
export class UpdatePullRequestFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        pullRequestNumber: number,
        title?: string,
        body?: string,
        state?: "open" | "closed",
        base?: string,
        maintainerCanModify?: boolean
    ): Promise<GitHubPullRequest> {
        if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1) {
            throw new RuntimeError("GITHUB_INVALID_PULL_REQUEST_NUMBER", "Pull request number must be a positive integer.")
        }

        try {
            const client = createGitHubClient(context)
            const response = await client.patch(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullRequestNumber}`,
                requestBody({ title, body, state, base, maintainer_can_modify: maintainerCanModify })
            )

            return GitHubPullRequestSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
