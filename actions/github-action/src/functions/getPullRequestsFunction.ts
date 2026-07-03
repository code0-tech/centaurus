import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequest, GitHubPullRequestSchema } from "../data_types/githubPullRequest.js"
import { createGitHubClient, handleGitHubError } from "../helpers.js"

type GitHubPullRequestState = "open" | "closed" | "all"

@Identifier("getPullRequests")
@Signature('(owner: string, repository: string, state?: "open"|"closed"|"all", page?: number, perPage?: number): GITHUB_PULL_REQUEST[]')
@Name({ code: "en-US", content: "Get pull requests" })
@DisplayMessage({ code: "en-US", content: "Get GitHub pull requests" })
@Documentation({
    code: "en-US",
    content: "Returns a page of pull requests from a GitHub repository.",
})
@Description({
    code: "en-US",
    content: "Returns pull requests from a GitHub repository.",
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
    runtimeName: "state",
    name: [{ code: "en-US", content: "State" }],
    description: [{ code: "en-US", content: "Filter by open, closed, or all pull requests. Defaults to open." }],
})
@Parameter({
    runtimeName: "page",
    name: [{ code: "en-US", content: "Page" }],
    description: [{ code: "en-US", content: "Page number to return. Defaults to 1." }],
})
@Parameter({
    runtimeName: "perPage",
    name: [{ code: "en-US", content: "Results per page" }],
    description: [{ code: "en-US", content: "Number of results per page, from 1 to 100. Defaults to 30." }],
})
export class GetPullRequestsFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        state: GitHubPullRequestState = "open",
        page = 1,
        perPage = 30
    ): Promise<GitHubPullRequest[]> {
        if (!Number.isInteger(page) || page < 1) {
            throw new RuntimeError("GITHUB_INVALID_PAGE", "Page must be a positive integer.")
        }
        if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100) {
            throw new RuntimeError("GITHUB_INVALID_PER_PAGE", "Results per page must be an integer from 1 to 100.")
        }

        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls`, {
                params: {
                    state,
                    page,
                    per_page: perPage,
                },
            })

            return GitHubPullRequestSchema.array().parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
