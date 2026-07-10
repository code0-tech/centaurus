import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubIssue, GitHubIssueSchema } from "../../data_types/issues/githubIssue.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

type GitHubIssueState = "open" | "closed" | "all"

@Identifier("getIssues")
@Signature('(owner: string, repository: string, state?: "open"|"closed"|"all", page?: number, perPage?: number): GITHUB_ISSUE[]')
@Name({ code: "en-US", content: "Get issues" })
@DisplayMessage({ code: "en-US", content: "Get GitHub issues" })
@Documentation({
    code: "en-US",
    content: "Returns a page of issues from a GitHub repository. Pull requests are excluded from the result.",
})
@Description({
    code: "en-US",
    content: "Returns issues from a GitHub repository.",
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
    description: [{ code: "en-US", content: "Filter by open, closed, or all issues. Defaults to open." }],
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
export class GetIssuesFunction {
    async run(context: FunctionContext, owner: string, repository: string, state: GitHubIssueState = "open", page = 1, perPage = 30): Promise<GitHubIssue[]> {
        if (!Number.isInteger(page) || page < 1) {
            throw new RuntimeError("GITHUB_INVALID_PAGE", "Page must be a positive integer.")
        }
        if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100) {
            throw new RuntimeError("GITHUB_INVALID_PER_PAGE", "Results per page must be an integer from 1 to 100.")
        }

        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues`, {
                params: {
                    state,
                    page,
                    per_page: perPage,
                },
            })

            if (!Array.isArray(response.data)) {
                throw new RuntimeError("GITHUB_INVALID_RESPONSE", "GitHub returned an invalid issues response.")
            }

            const issues = response.data.filter((item: unknown) => typeof item === "object" && item !== null && !("pull_request" in item))

            return GitHubIssueSchema.array().parse(issues)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
