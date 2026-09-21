import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubWorkflowRun, GitHubWorkflowRunSchema } from "../../data_types/ciAutomation/githubWorkflow.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getWorkflowRuns")
@Signature("(owner: string, repository: string, workflowId?: string, page?: number, perPage?: number): GITHUB_WORKFLOW_RUN[]")
@Name({ code: "en-US", content: "Get workflow runs" })
@DisplayMessage({ code: "en-US", content: "Get GitHub workflow runs" })
@Documentation({ code: "en-US", content: "Returns workflow runs for a repository or a specific workflow." })
@Description({ code: "en-US", content: "Returns GitHub workflow runs." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "workflowId", name: [{ code: "en-US", content: "Workflow ID or file name" }] })
export class GetWorkflowRunsFunction {
    async run(context: FunctionContext, owner: string, repository: string, workflowId?: string, page = 1, perPage = 30): Promise<GitHubWorkflowRun[]> {
        if (!Number.isInteger(page) || page < 1) throw new RuntimeError("GITHUB_INVALID_PAGE", "Page must be a positive integer.")
        if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100)
            throw new RuntimeError("GITHUB_INVALID_PER_PAGE", "Results per page must be an integer from 1 to 100.")
        try {
            const client = createGitHubClient(context)
            const path = workflowId
                ? `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/actions/workflows/${encodeURIComponent(workflowId)}/runs`
                : `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/actions/runs`
            const response = await client.get(path, { params: { page, per_page: perPage } })
            return GitHubWorkflowRunSchema.array().parse(response.data.workflow_runs)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
