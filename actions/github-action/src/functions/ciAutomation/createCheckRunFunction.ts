import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubCheckRun, GitHubCheckRunSchema } from "../../data_types/ciAutomation/githubCiAutomation.js"
import { GitHubCreateCheckRunRequest } from "../../data_types/ciAutomation/githubCiAutomationRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("createCheckRun")
@Signature("(owner: string, repository: string, data: GITHUB_CREATE_CHECK_RUN_REQUEST): GITHUB_CHECK_RUN")
@Name({ code: "en-US", content: "Create check run" })
@DisplayMessage({ code: "en-US", content: "Create GitHub check run" })
@Documentation({ code: "en-US", content: "Creates a check run." })
@Description({ code: "en-US", content: "Creates a GitHub check run." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "data", name: [{ code: "en-US", content: "Check run" }] })
export class CreateCheckRunFunction {
    async run(context: FunctionContext, owner: string, repository: string, data: GitHubCreateCheckRunRequest): Promise<GitHubCheckRun> {
        try {
            const client = createGitHubClient(context)
            const response = await client.post(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/check-runs`, data)
            return GitHubCheckRunSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
