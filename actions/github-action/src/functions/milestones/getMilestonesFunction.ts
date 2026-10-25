import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubMilestone, GitHubMilestoneSchema } from "../../data_types/milestones/githubMilestone.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getMilestones")
@Signature('(owner: string, repository: string, state?: "open"|"closed"|"all", page?: number, perPage?: number): GITHUB_MILESTONE[]')
@Name({ code: "en-US", content: "Get milestones" })
@DisplayMessage({ code: "en-US", content: "Get GitHub milestones" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Returns milestones from a GitHub repository." })
@Description({ code: "en-US", content: "Returns GitHub milestones." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({
    runtimeName: "state",
    name: [{ code: "en-US", content: "State" }],
    description: [{ code: "en-US", content: "Filter by open, closed, or all milestones. Defaults to open." }],
    optional: true,
    defaultValue: "open",
})
@Parameter({
    runtimeName: "page",
    name: [{ code: "en-US", content: "Page" }],
    description: [{ code: "en-US", content: "Page number to return. Defaults to 1." }],
    optional: true,
    defaultValue: 1,
})
@Parameter({
    runtimeName: "perPage",
    name: [{ code: "en-US", content: "Results per page" }],
    description: [{ code: "en-US", content: "Number of results per page, from 1 to 100. Defaults to 30." }],
    optional: true,
    defaultValue: 30,
})
export class GetMilestonesFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        state: "open" | "closed" | "all" = "open",
        page = 1,
        perPage = 30
    ): Promise<GitHubMilestone[]> {
        if (!Number.isInteger(page) || page < 1) throw new RuntimeError("GITHUB_INVALID_PAGE", "Page must be a positive integer.")
        if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100)
            throw new RuntimeError("GITHUB_INVALID_PER_PAGE", "Results per page must be an integer from 1 to 100.")
        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/milestones`, {
                params: { state, page, per_page: perPage },
            })
            return GitHubMilestoneSchema.array().parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
