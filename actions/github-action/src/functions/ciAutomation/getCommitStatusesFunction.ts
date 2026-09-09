import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubCommitStatus, GitHubCommitStatusSchema } from "../../data_types/ciAutomation/githubCiAutomation.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getCommitStatuses")
@Signature("(owner: string, repository: string, ref: string): GITHUB_COMMIT_STATUS[]")
@Name({ code: "en-US", content: "Get commit statuses" })
@DisplayMessage({ code: "en-US", content: "Get GitHub commit statuses" })
@Documentation({ code: "en-US", content: "Returns commit statuses for a ref." })
@Description({ code: "en-US", content: "Returns GitHub commit statuses." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "ref", name: [{ code: "en-US", content: "Ref" }] })
export class GetCommitStatusesFunction {
    async run(context: FunctionContext, owner: string, repository: string, ref: string): Promise<GitHubCommitStatus[]> {
        try {
            const client = createGitHubClient(context)
            const response = await client.get(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits/${encodeURIComponent(ref)}/statuses`
            )
            return GitHubCommitStatusSchema.array().parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
