import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubPullRequest, GitHubPullRequestSchema } from "../../data_types/pullRequests/githubPullRequest.js"
import { createGitHubClient, handleGitHubError, requestBody } from "../../helpers.js"

@Identifier("createPullRequest")
@Signature(
    "(owner: string, repository: string, head: string, base: string, title?: string, body?: string, draft?: boolean, maintainerCanModify?: boolean): GITHUB_PULL_REQUEST"
)
@Name({ code: "en-US", content: "Create pull request" })
@DisplayMessage({ code: "en-US", content: "Create GitHub pull request" })
@DisplayIcon("tabler:brand-github")
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
    runtimeName: "head",
    name: [{ code: "en-US", content: "Source branch" }],
    description: [{ code: "en-US", content: "Branch that contains the changes." }],
})
@Parameter({
    runtimeName: "base",
    name: [{ code: "en-US", content: "Target branch" }],
    description: [{ code: "en-US", content: "Branch the changes are merged into." }],
})
@Parameter({
    runtimeName: "title",
    name: [{ code: "en-US", content: "Title" }],
    description: [{ code: "en-US", content: "Title of the pull request." }],
    optional: true,
})
@Parameter({
    runtimeName: "body",
    name: [{ code: "en-US", content: "Body" }],
    description: [{ code: "en-US", content: "Description of the pull request." }],
    optional: true,
})
@Parameter({
    runtimeName: "draft",
    name: [{ code: "en-US", content: "Draft" }],
    description: [{ code: "en-US", content: "Whether the pull request is created as a draft." }],
    optional: true,
})
@Parameter({
    runtimeName: "maintainerCanModify",
    name: [{ code: "en-US", content: "Maintainers can modify" }],
    description: [{ code: "en-US", content: "Whether maintainers may push to the source branch." }],
    optional: true,
})
export class CreatePullRequestFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        head: string,
        base: string,
        title?: string,
        body?: string,
        draft?: boolean,
        maintainerCanModify?: boolean
    ): Promise<GitHubPullRequest> {
        try {
            const client = createGitHubClient(context)
            const response = await client.post(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls`,
                requestBody({ head, base, title, body, draft, maintainer_can_modify: maintainerCanModify })
            )

            return GitHubPullRequestSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
