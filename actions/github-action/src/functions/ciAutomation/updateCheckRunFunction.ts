import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubCheckRun, GitHubCheckRunSchema } from "../../data_types/ciAutomation/githubCiAutomation.js"
import { GitHubUpdateCheckRunRequest } from "../../data_types/ciAutomation/githubCiAutomationRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("updateCheckRun")
@Signature("(owner: string, repository: string, checkRunId: number, data: GITHUB_UPDATE_CHECK_RUN_REQUEST): GITHUB_CHECK_RUN")
@Name({ code: "en-US", content: "Update check run" })
@DisplayMessage({ code: "en-US", content: "Update GitHub check run" })
@Documentation({ code: "en-US", content: "Updates a check run." })
@Description({ code: "en-US", content: "Updates a GitHub check run." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "checkRunId", name: [{ code: "en-US", content: "Check run ID" }] })
@Parameter({ runtimeName: "data", name: [{ code: "en-US", content: "Check run updates" }] })
export class UpdateCheckRunFunction {
    async run(context: FunctionContext, owner: string, repository: string, checkRunId: number, data: GitHubUpdateCheckRunRequest): Promise<GitHubCheckRun> {
        if (!Number.isInteger(checkRunId) || checkRunId < 1) throw new RuntimeError("GITHUB_INVALID_CHECK_RUN_ID", "Check run ID must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.patch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/check-runs/${checkRunId}`, data)
            return GitHubCheckRunSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
