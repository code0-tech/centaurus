import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubDispatchWorkflowRequest } from "../../data_types/ciAutomation/githubWorkflowRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("dispatchWorkflow")
@Signature("(owner: string, repository: string, workflowId: string, data: GITHUB_DISPATCH_WORKFLOW_REQUEST): void")
@Name({ code: "en-US", content: "Dispatch workflow" })
@DisplayMessage({ code: "en-US", content: "Dispatch GitHub workflow" })
@Documentation({ code: "en-US", content: "Triggers a GitHub Actions workflow dispatch event." })
@Description({ code: "en-US", content: "Dispatches a GitHub workflow." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "workflowId", name: [{ code: "en-US", content: "Workflow ID or file name" }] })
@Parameter({ runtimeName: "data", name: [{ code: "en-US", content: "Dispatch" }] })
export class DispatchWorkflowFunction {
    async run(context: FunctionContext, owner: string, repository: string, workflowId: string, data: GitHubDispatchWorkflowRequest): Promise<void> {
        try {
            const client = createGitHubClient(context)
            await client.post(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/actions/workflows/${encodeURIComponent(workflowId)}/dispatches`,
                data
            )
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
