import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubWorkflowInputs } from "../../data_types/ciAutomation/githubWorkflowInputs.js"
import { createGitHubClient, handleGitHubError, requestBody } from "../../helpers.js"

@Identifier("dispatchWorkflow")
@Signature("(owner: string, repository: string, workflowId: string, ref: string, inputs?: GITHUB_WORKFLOW_INPUTS): void")
@Name({ code: "en-US", content: "Dispatch workflow" })
@DisplayMessage({ code: "en-US", content: "Dispatch GitHub workflow" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Triggers a GitHub Actions workflow dispatch event." })
@Description({ code: "en-US", content: "Dispatches a GitHub workflow." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "workflowId", name: [{ code: "en-US", content: "Workflow ID or file name" }], description: [{ code: "en-US", content: "Numeric identifier or file name of the workflow." }] })
@Parameter({ runtimeName: "ref", name: [{ code: "en-US", content: "Branch or tag" }], description: [{ code: "en-US", content: "Git reference the workflow runs on." }] })
@Parameter({
    runtimeName: "inputs",
    name: [{ code: "en-US", content: "Inputs" }],
    description: [{ code: "en-US", content: "Inputs the workflow declares, as key-value pairs." }],
    optional: true,
})
export class DispatchWorkflowFunction {
    async run(context: FunctionContext, owner: string, repository: string, workflowId: string, ref: string, inputs?: GitHubWorkflowInputs): Promise<void> {
        try {
            const client = createGitHubClient(context)
            await client.post(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/actions/workflows/${encodeURIComponent(workflowId)}/dispatches`,
                requestBody({ ref, inputs })
            )
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
