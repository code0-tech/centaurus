import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubCommitStatus, GitHubCommitStatusSchema } from "../../data_types/ciAutomation/githubCiAutomation.js"
import { GitHubCreateCommitStatusRequest } from "../../data_types/ciAutomation/githubCiAutomationRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("createCommitStatus")
@Signature("(owner: string, repository: string, sha: string, data: GITHUB_CREATE_COMMIT_STATUS_REQUEST): GITHUB_COMMIT_STATUS")
@Name({ code: "en-US", content: "Create commit status" })
@DisplayMessage({ code: "en-US", content: "Create GitHub commit status" })
@Documentation({ code: "en-US", content: "Creates a commit status." })
@Description({ code: "en-US", content: "Creates a GitHub commit status." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "sha", name: [{ code: "en-US", content: "SHA" }] })
@Parameter({ runtimeName: "data", name: [{ code: "en-US", content: "Status" }] })
export class CreateCommitStatusFunction {
    async run(context: FunctionContext, owner: string, repository: string, sha: string, data: GitHubCreateCommitStatusRequest): Promise<GitHubCommitStatus> {
        try {
            const client = createGitHubClient(context)
            const response = await client.post(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/statuses/${encodeURIComponent(sha)}`,
                data
            )
            return GitHubCommitStatusSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
