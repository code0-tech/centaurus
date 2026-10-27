import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubWorkflow, GitHubWorkflowSchema } from "../../data_types/ciAutomation/githubWorkflow.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getWorkflows")
@Signature("(owner: string, repository: string, page?: number, perPage?: number): GITHUB_WORKFLOW[]")
@Name({ code: "en-US", content: "Get workflows" })
@DisplayMessage({ code: "en-US", content: "Get GitHub workflows" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Returns GitHub Actions workflows for a repository." })
@Description({ code: "en-US", content: "Returns GitHub workflows." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
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
export class GetWorkflowsFunction {
    async run(context: FunctionContext, owner: string, repository: string, page = 1, perPage = 30): Promise<GitHubWorkflow[]> {
        if (!Number.isInteger(page) || page < 1) throw new RuntimeError("GITHUB_INVALID_PAGE", "Page must be a positive integer.")
        if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100)
            throw new RuntimeError("GITHUB_INVALID_PER_PAGE", "Results per page must be an integer from 1 to 100.")
        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/actions/workflows`, {
                params: { page, per_page: perPage },
            })
            return GitHubWorkflowSchema.array().parse(response.data.workflows)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
