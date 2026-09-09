import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("rerunWorkflowRun")
@Signature("(owner: string, repository: string, runId: number): void")
@Name({ code: "en-US", content: "Rerun workflow run" })
@DisplayMessage({ code: "en-US", content: "Rerun GitHub workflow run" })
@Documentation({ code: "en-US", content: "Reruns a GitHub Actions workflow run." })
@Description({ code: "en-US", content: "Reruns a GitHub workflow run." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "runId", name: [{ code: "en-US", content: "Run ID" }] })
export class RerunWorkflowRunFunction {
    async run(context: FunctionContext, owner: string, repository: string, runId: number): Promise<void> {
        if (!Number.isInteger(runId) || runId < 1) throw new RuntimeError("GITHUB_INVALID_WORKFLOW_RUN_ID", "Workflow run ID must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            await client.post(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/actions/runs/${runId}/rerun`)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
